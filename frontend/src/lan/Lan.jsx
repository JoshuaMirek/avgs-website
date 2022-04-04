import React, { useContext, useEffect, useState } from "react";

import axios from "axios";
import propTypes from "prop-types";
import { Button, Col, Container, Row } from "reactstrap";

import CsrfTokenContext from "../utils/CsrfTokenContext";

export default function Lan({ isAuthenticated }) {
  const [currentLan, setCurrentLan] = useState();
  const [hasTicket, setHasTicket] = useState(false);
  const [requestedTicket, setRequestedTicket] = useState(false);
  const [lanCountdownTime, setLanCountdownTime] = useState();
  const [timer, setTimer] = useState();

  useEffect(() => {
    axios
      .get("/api/events/current_lan/")
      .then((res) => {
        setCurrentLan(res.data);
        console.log(currentLan);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      axios
        .get("/api/lan-tickets/my_lan_ticket/", { withCredentials: true })
        .then((res) => {
          setHasTicket(true);
          console.log(res);
        })
        .catch((err) => console.log(err));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      axios
        .get("/api/lan-ticket-requests/my_lan_ticket_request/", {
          withCredentials: true,
        })
        .then((res) => {
          setRequestedTicket(true);
          console.log(res);
        })
        .catch((err) => console.log(err));
    }
  }, [isAuthenticated]);

  // TODO: Consider this as a reason to use moment.js or similar.
  function tick() {
    setLanCountdownTime(
      new Date(currentLan.start_time).getTime() - new Date().getTime()
    );
  }
  useEffect(() => {
    if (currentLan) {
      setTimer(setInterval(() => tick(), 1000));
    }
    return () => {
      clearInterval(timer);
    };
  }, [currentLan]);

  function displayCountdownTime(ms) {
    let seconds = Math.floor((ms / 1000) % 60);
    let minutes = Math.floor((ms / (1000 * 60)) % 60);
    let hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

    hours = hours < 10 ? `0${hours}` : hours;
    minutes = minutes < 10 ? `0${minutes}` : minutes;
    seconds = seconds < 10 ? `0${seconds}` : seconds;

    return `${hours}:${minutes}:${seconds}`;
  }

  // Get CSRF token from context.
  const csrfTokenCookie = useContext(CsrfTokenContext);

  function requestTicket() {
    axios
      .post(
        "/api/lan-ticket-requests/",
        {},
        {
          withCredentials: true,
          headers: { "X-CSRFToken": csrfTokenCookie },
        }
      )
      .then((res) => {
        // TODO: Apparently this is necessary to catch internal server errors,
        //       e.g., when withCredentials isn't provided, so it may be
        //       necessary to amend all the other axios requests
        if (res.status >= 200 && res.status <= 299) {
          setRequestedTicket(true);
        }
      })
      .catch((err) => console.log(err));
  }

  return (
    <main>
      <Container fluid className="p-5 bg-primary text-white text-center">
        {!currentLan && (
          <>
            <h2>LAN parties</h2>
            <p>Stay tuned for the next one!</p>
          </>
        )}
        {currentLan && (
          <>
            <h2>{currentLan.name}</h2>
            {Number.isInteger(lanCountdownTime) && (
              <h5>Starts in {displayCountdownTime(lanCountdownTime)}</h5>
            )}
          </>
        )}
      </Container>
      <Container className="mt-5">
        <Row>
          {!requestedTicket && (
            <Col sm="6">
              <h2>How to get a ticket</h2>
              <ol>
                <li className="fs-4 mt-3">Purchase one here: ...</li>
                <li className="fs-4 mt-3">
                  Then,{" "}
                  {!isAuthenticated && (
                    <>
                      <a href="/login">login</a> and
                    </>
                  )}{" "}
                  click the button below to send a request to committee to check
                  and give you access.
                  <Button
                    type="button"
                    onClick={() => requestTicket()}
                    disabled={!isAuthenticated}
                  >
                    I&apos;ve bought a ticket
                  </Button>
                </li>
              </ol>
            </Col>
          )}
          {requestedTicket && !hasTicket && (
            <Col sm="6">
              <h2>Waiting for committee to verify ticket purchase.</h2>
            </Col>
          )}
          {hasTicket && (
            <Col sm="6">
              <h2>LAN to-do list:</h2>
              <ol>
                <li>
                  <a href="/lan/rules/">Read the rules for LANs.</a>
                </li>
                {/* TODO: Make this conditional on whether LAN van will be run. */}
                <li>
                  <a href="/lan/van-booking/">
                    Book the LAN van pick-up service. ...
                  </a>
                </li>
                <li>
                  <a href="/lan/seat-booking/">Book a seating group. ...</a>
                </li>
              </ol>
            </Col>
          )}
        </Row>
      </Container>
    </main>
  );
}
Lan.propTypes = {
  isAuthenticated: propTypes.bool.isRequired,
};
