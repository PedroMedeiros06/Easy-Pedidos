// Componentes legados ainda em .jsx (shadcn/ui e modais antigos) não têm tipos.
// Até a migração pra .tsx, tratamos como `any` pra não travar o type-check do código novo.
declare module "@/components/ui/*";
declare module "@/components/client/*";
