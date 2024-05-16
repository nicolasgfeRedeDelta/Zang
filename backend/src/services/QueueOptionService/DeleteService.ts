import ShowQueueOptionServices from "./ShowQueueOptionServices";

const DeleteService = async (queueOptionId: number | string): Promise<void> => {
  const queueOption = await ShowQueueOptionServices(queueOptionId);

  await queueOption.destroy();
};

export default DeleteService;
