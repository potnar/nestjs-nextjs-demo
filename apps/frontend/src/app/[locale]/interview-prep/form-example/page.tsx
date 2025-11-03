import FormExample from "@/components/FormExample";

export default function Page() {      // ← MUSI być export default
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Form Example</h1>
      <FormExample />
    </div>
  );
}
