import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIndicator,
  AlertTitle,
} from "@/components/tailgrids/core/alert";

interface FormErrorProps {
  message: string | null | undefined;
  title?: string;
}

/** Error general del formulario (lo lanzado por la server action). */
export function FormError({ message, title = "No se pudo completar" }: FormErrorProps) {
  if (!message) return null;

  return (
    <Alert status="error">
      <AlertIndicator />
      <AlertContent className="gap-1">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </AlertContent>
    </Alert>
  );
}
