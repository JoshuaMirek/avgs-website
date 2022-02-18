"""avgs_website URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework import routers, urls as api_auth_urls

from accounts import views as account_views
from blog import views as blog_views
from events import views as event_views

router = routers.DefaultRouter()
router.register(r"accounts", account_views.UserView)
router.register(r"blog", blog_views.PostView)
router.register(r"events", event_views.EventsView, "event")

# TODO: Should viewsets end in ViewSet instead of View?
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/login/", account_views.login_view),
    path("api/logout/", account_views.logout_view),
    path("api/profile/", account_views.ProfileView.as_view()),
    path("api/session/", account_views.SessionView.as_view()),
    path("api/api-auth/", include(api_auth_urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
