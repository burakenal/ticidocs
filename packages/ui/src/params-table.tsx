import type { ApiParameter } from "@ticidocs/openapi/types";
import styles from "./params-table.module.css";

export function ParamsTable({
  title,
  parameters,
}: {
  title: string;
  parameters: ApiParameter[];
}) {
  if (parameters.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Required</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {parameters.map((param) => {
              const type =
                (Array.isArray(param.schema?.type)
                  ? param.schema?.type.join(" | ")
                  : param.schema?.type) ?? "any";
              return (
                <tr key={`${param.in}-${param.name}`}>
                  <td>
                    <code>{param.name}</code>
                    <div className={styles.in}>{param.in}</div>
                  </td>
                  <td>
                    <code>{type}</code>
                  </td>
                  <td>{param.required ? "Yes" : "No"}</td>
                  <td>{param.description ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
