import { useState } from "react";

const Form = ({ fields = [], onSubmit }: any) => {
  const [form, setForm] = useState<any>({});

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(form);
        setForm({});
      }}
    >
      {fields.map((f: string) => (
        <input
          key={f}
          name={f}
          onChange={(e) =>
            setForm({ ...form, [f]: e.target.value })
          }
        />
      ))}
      <button type="submit">Save</button>
    </form>
  );
};

export default Form;