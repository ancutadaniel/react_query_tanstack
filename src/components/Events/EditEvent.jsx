import {
  Link,
  redirect,
  useNavigate,
  useNavigation,
  useParams,
  useSubmit,
} from "react-router-dom";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchEvent, queryClient, updateEvent } from "../../util/http.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";

export default function EditEvent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const submit = useSubmit();
  const { state } = useNavigation();

  const { data, isError, error } = useQuery({
    queryKey: ["events", { id }], // 👈 query key
    queryFn: ({ signal }) => fetchEvent({ id, signal }),
    staleTime: 10000,
  });

  // Mutate with onMutate optimistic update to update the cache
  const { mutate } = useMutation({
    mutationFn: updateEvent,
    onMutate: async (data) => {
      const newEvent = data.event;
      // Cancel any outgoing queries with the same key
      await queryClient.cancelQueries({ queryKey: ["events", { id }] });

      // Get the previous value
      const previousEvent = queryClient.getQueryData(["events", { id }]);

      // Optimistically update the cache with the new event
      queryClient.setQueryData(["events", { id }], newEvent);

      // Return a context object with the previous event
      return { previousEvent };
    },
    onError: (error, data, context) => {
      // Rollback the optimistic update
      queryClient.setQueryData(["events", { id }], context.previousEvent);
    },
    onSettled: () => {
      // Invalidate the cache
      queryClient.invalidateQueries({ queryKey: ["events", { id }] });
    },
  });

  function handleSubmit(formData) {
    // 1 - used with optimistic updates
    // mutate({
    //   id,
    //   event: eventData,
    // });
    // navigate("../");

    // 2 - used with useSubmit
    submit(formData, {
      method: "PUT",
    });
  }

  function handleClose() {
    navigate("../");
  }

  let content;

  if (isError) {
    content = (
      <>
        <ErrorBlock
          title="An error occurred"
          message={error.info?.message || "Failed to load event"}
        />
        <div className="form-actions">
          <Link to="../" className="button-text">
            OK
          </Link>
        </div>
      </>
    );
  }

  if (data) {
    content = (
      <EventForm inputData={data} onSubmit={handleSubmit}>
        {state === "submitting" ? (
          <p>Sending data...</p>
        ) : (
          <>
            <Link to="../" className="button-text">
              Cancel
            </Link>
            <button type="submit" className="button">
              Update
            </button>
          </>
        )}
      </EventForm>
    );
  }

  return <Modal onClose={handleClose}>{content}</Modal>;
}

export const loader = async ({ params }) => {
  const { id } = params;
  return queryClient.fetchQuery({
    queryKey: ["events", { id }], // 👈 query key
    queryFn: ({ signal }) => fetchEvent({ id, signal }),
  });
};

export const action = async ({ params, request }) => {
  const formData = await request.formData();
  const updateData = Object.fromEntries(formData);

  await updateEvent({ id: params.id, event: updateData });

  await queryClient.invalidateQueries(["events"]);
  return redirect("../");
};
