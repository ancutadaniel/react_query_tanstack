import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, Outlet, useNavigate, useParams } from "react-router-dom";

import Header from "../Header.jsx";
import { deleteEvent, fetchEvent, queryClient } from "../../util/http.js";
import LoadingIndicator from "../UI/LoadingIndicator.jsx";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import { useState } from "react";
import Modal from "../UI/Modal.jsx";

const EventDetails = () => {
  let content;
  const { id } = useParams();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["events", { id }], // 👈 query key
    queryFn: ({ signal }) => fetchEvent({ id, signal }),
  });

  const {
    mutate,
    isPending: isDeletePending,
    isError: isDeleteError,
    error: deleteError,
  } = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["events"],
        refetchType: "none",
      });
      navigate("/events");
    },
  });

  const handleStartDeleteEvent = () => {
    setIsDeleting(true);
  };

  const handleCancelDeleteEvent = () => {
    setIsDeleting(false);
  };

  const handleDeleteEvent = () => {
    mutate({ id });
  };

  if (isPending) {
    content = (
      <div id="event-details-content" className="center">
        <LoadingIndicator />
      </div>
    );
  }

  if (isError) {
    content = (
      <div id="event-details-content" className="center">
        <ErrorBlock
          title="An error occurred"
          message={error.info?.message || "Failed to load event"}
        />
      </div>
    );
  }

  if (data) {
    const date = new Date(data.date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    content = (
      <article id="event-details">
        <header>
          <h1>{data.title}</h1>
          <nav>
            <button onClick={handleStartDeleteEvent}>Delete</button>
            <Link to="edit">Edit</Link>
          </nav>
        </header>
        <div id="event-details-content">
          <img
            src={`http://localhost:3000/${data.image}`}
            alt={`${data.title}`}
          />
          <div id="event-details-info">
            <div>
              <p id="event-details-location">{data.location}</p>
              <time dateTime={`Todo-DateT$Todo-Time`}>
                {date} @ {data.time}
              </time>
            </div>
            <p id="event-details-description">{data.description}</p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <>
      {isDeleting && (
        <Modal onClose={handleCancelDeleteEvent}>
          <h2>Are you sure ?</h2>
          <p>Do you really want to delete this event?</p>
          <div className="form-actions">
            {isDeletePending && <p>Deleting...</p>}
            {!isDeletePending && (
              <>
                <button
                  onClick={handleCancelDeleteEvent}
                  className="button-text"
                  >
                  Cancel
                </button>
                <button onClick={handleDeleteEvent} className="button">
                  Delete
                </button>
              </>
            )}
          </div>
            {isDeleteError && (
              <ErrorBlock
                title="An error occurred"
                message={deleteError.info?.message || "Failed to delete event"}
              />
            )}
        </Modal>
      )}
      <Outlet />
      <Header>
        <Link to="/events" className="nav-item">
          View all Events
        </Link>
      </Header>
      {content}
    </>
  );
};

export default EventDetails;
