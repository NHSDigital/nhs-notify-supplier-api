export type ErrorLink = {
  about: string;
};

type ErrorResponse = {
  id: string;
  code: string;
  links: ErrorLink;
  status: string;
  title: string;
  detail: string;
};

export type ErrorMessageBody = {
  errors: ErrorResponse[];
};
