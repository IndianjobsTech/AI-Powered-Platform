import { Response } from 'express';

interface ApiResponseOptions {
  message?: string;
  data?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const sendSuccess = (
  res: Response,
  options: ApiResponseOptions = {},
  statusCode: number = 200
) => {
  const response: any = {
    success: true,
    message: options.message || 'Success',
  };

  if (options.data !== undefined) {
    response.data = options.data;
  }

  if (options.meta) {
    response.meta = options.meta;
  }

  return res.status(statusCode).json(response);
};

export const sendCreated = (res: Response, data: any, message?: string) => {
  return sendSuccess(res, { data, message: message || 'Created successfully' }, 201);
};

export const sendNoContent = (res: Response) => {
  return res.status(204).send();
};

export const paginateResponse = (
  res: Response,
  data: any[],
  total: number,
  page: number,
  limit: number
) => {
  return sendSuccess(res, {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};
