export type ProblemDetail = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  // Custom fields
  code?: string;
  traceId?: string;
};

