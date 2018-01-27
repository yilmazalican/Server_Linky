function respond(res, obj, status) {
  if (status) return res.status(status).json(obj);
  res.json(obj);
}

module.exports = respond;