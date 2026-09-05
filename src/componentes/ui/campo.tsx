import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export const clasesCampo =
  "rounded-md border border-neutral-300 px-3 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500";

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

export function Campo(props: PropsInput | PropsSelect) {
  const { etiqueta, id, ayuda, className, ...resto } = props;

  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      {etiqueta && (
        <label htmlFor={id} className="text-sm font-medium text-neutral-900">
          {etiqueta}
        </label>
      )}
      {props.as === "select" ? (
        <select
          id={id}
          className={clasesCampo}
          {...(resto as SelectHTMLAttributes<HTMLSelectElement>)}
        >
          {props.children}
        </select>
      ) : (
        <input id={id} className={clasesCampo} {...(resto as InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {ayuda && <p className="text-xs text-neutral-500">{ayuda}</p>}
    </div>
  );
}
