export const formatDate = (input: string): string => {
  const date = new Date(input);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear() % 100;

  return `${day}.${month.toString().padStart(2, "0")}.${year}`;
};
