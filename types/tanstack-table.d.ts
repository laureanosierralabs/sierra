import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // Extend ColumnMeta to include any custom per-column metadata fields used
  // across the project (e.g. headerClassName for custom header styling).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- generics must match the augmented declaration
  interface ColumnMeta<TData extends RowData, TValue> {
    headerClassName?: string;
  }
}
