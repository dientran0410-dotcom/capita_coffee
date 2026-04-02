const Table = ({ data = [], columns = [] }: any) => {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((c: any) => (
            <th key={c.key}>{c.label}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row: any, i: number) => (
          <tr key={i}>
            {columns.map((c: any) => (
              <td key={c.key}>
                {c.render ? c.render(row) : row[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;