/**
 * Standard response format for successful API responses
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Response message
 * @param {Object|Array} data - Response data
 * @param {Object} meta - Optional metadata (pagination, etc.)
 * @returns {Object} Formatted response
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = {}, meta = {}) => {
  const response = {
    success: true,
    message,
    data
  };

  // Add metadata if provided
  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Convenience method for 200 OK responses
 */
const okResponse = (res, message = 'Success', data = {}, meta = {}) => {
  return successResponse(res, 200, message, data, meta);
};

/**
 * Convenience method for 201 Created responses
 */
const createdResponse = (res, message = 'Resource created successfully', data = {}, meta = {}) => {
  return successResponse(res, 201, message, data, meta);
};

/**
 * Convenience method for 204 No Content responses
 */
const noContentResponse = (res, message = 'Resource deleted successfully') => {
  return res.status(204).send();
};

/**
 * Generate paginated response metadata
 * @param {number} total - Total number of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const paginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    pagination: {
      total,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    }
  };
};

module.exports = {
  successResponse,
  okResponse,
  createdResponse,
  noContentResponse,
  paginationMeta
}; 