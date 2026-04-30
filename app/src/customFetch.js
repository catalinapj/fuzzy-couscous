const customFetch = async (url, options) => {
  const response = await fetch(url, options);
  if (response.status === 401) {
    navigate("/login");
    return;
  }
  return response;
};

export default customFetch;