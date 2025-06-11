export async function fetchFolderStructure() {
  const res = await fetch("http://localhost:3000/files");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}
