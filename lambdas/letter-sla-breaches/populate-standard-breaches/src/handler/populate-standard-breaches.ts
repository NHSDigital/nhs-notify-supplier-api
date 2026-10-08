export type PopulateStandardBreachesEvent = {
  date: string;
};

export type PopulateStandardBreachesResult = {
  status: "SUCCESS";
  message: string;
};

// Placeholder: cache population is not yet implemented.
export default async function populateStandardBreaches(
  _event: PopulateStandardBreachesEvent,
): Promise<PopulateStandardBreachesResult> {
  return {
    status: "SUCCESS",
    message: "populate-standard-breaches invoked successfully",
  };
}
