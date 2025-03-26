const sendData = (event: string, data: unknown) => {
  const result = { event, data };
  send(result);
  return result;
};

const sendDataAndLog = (event: string, data: unknown) => {
  console.log(JSON.stringify(sendData(event, data)));
};

export { sendData, sendDataAndLog };
