import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/** Sin ancho: quien lo usa suelto (el carné en tres partes, por ejemplo) decide el suyo. */
export const clasesCampo =
  "min-h-12 rounded-xl border-[1.5px] border-linea bg-white px-3.5 py-2.5 text-base text-tinta placeholder:text-neutral-400 focus-visible:border-primary-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-100 read-only:bg-neutral-50";

type PropsComunes = {
  etiqueta?: string;
  id: string;
  ayuda?: string;
  className?: string;
};

type PropsInput = PropsComunes &
  InputHTMLAttributes<HTMLInputElement> & {
    as?: "input";
  };

type PropsSelect = PropsComunes &
  SelectHTMLAttributes<HTMLSelectElement> & {
    as: "select";
    children: ReactNode;
  };

type PropsTextarea = PropsComunes &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    as: "textarea";
  };

export function Campo(props: PropsInput | PropsSelect | PropsTextarea) {
  const { etiqueta, id, ayuda, className, as, ...resto } = props;
  const clases = `${clasesCampo} w-full`;

  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className ?? ""}`}>
      {etiqueta && (
        <label htmlFor={id} className="text-[13px] font-semibold text-tinta">
          {etiqueta}
        </label>
      )}
      {as === "select" ? (
        <select id={id} className={clases} {...(resto as SelectHTMLAttributes<HTMLSelectElement>)}>
          {(props as PropsSelect).children}
        </select>
      ) : as === "textarea" ? (
        <textarea
          id={id}
          className={`${clases} resize-none`}
          {...(resto as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input id={id} className={clases} {...(resto as InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {ayuda && <p className="text-xs text-neutral-500">{ayuda}</p>}
    </div>
  );
}
