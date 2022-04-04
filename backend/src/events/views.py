from django.db.models.query_utils import Q
from django.shortcuts import render
from lans.views import get_current_lan
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import SAFE_METHODS, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.serializers import Serializer

from .models import Event
from .serializers import EventSerializer


class EventsViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

    # TODO: Move this to a Manager method on the Events model?
    def get_queryset(self):
        year = self.request.query_params.get("year")
        month = self.request.query_params.get("month")

        # Return all events taking place over the requested month ordered by
        # start time.
        if year and month:
            self.queryset = self.queryset.filter(
                (
                    Q(start_time__year__lt=year)
                    | (Q(start_time__year=year) & Q(start_time__month__lte=month))
                ),
                (
                    Q(end_time__year__gt=year)
                    | (Q(end_time__year=year) & Q(end_time__month__gte=month))
                ),
            )
        # Filter events to the current LAN.
        # TODO: Instead of using a custom action, use a query parameter.
        elif self.action == "current_lan_events":
            # FIXME: Should return negative if get_current_lan() throws Event.DoesNotExist
            self.queryset = self.queryset.filter(parent=get_current_lan())

        self.queryset = self.queryset.order_by("start_time")

        return super().get_queryset()

    def get_permissions(self):
        # All users can see events but only admins can create, edit, or
        # delete them.
        if self.action in SAFE_METHODS + (
            "list",
            "current_lan",
            "current_lan_events",
        ):
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsAdminUser]
        return super().get_permissions()

    # FIXME: Should return negative if get_current_lan() throws Event.DoesNotExist
    @action(detail=False)
    def current_lan(self, request):
        current_lan = get_current_lan()
        serializer = self.get_serializer(current_lan)
        return Response(serializer.data)

    @action(detail=False)
    def current_lan_events(self, request):
        lan_events = self.get_queryset()
        serializer = self.get_serializer(lan_events, many=True)
        return Response(serializer.data)
