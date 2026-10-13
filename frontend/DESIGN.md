# EscolaApp — Design System

## Color
Primária blue-600 (#2563eb), hover blue-700. Fundo gray-50, cards brancos com
borda gray-200 e radius-lg. Sucesso verde, alerta amarelo, perigo vermelho,
info azul (badges pastel *-100 com texto *-800). Tema escuro via classe
`.dark` remapeando surfaces e textos.

## Type
Inter via next/font (display swap). Títulos font-bold (2xl página, xl seção,
lg card). Corpo text-sm/base gray-600/700. Meta text-xs gray-500.

## Shape
radius-md botões/inputs, radius-lg cards, radius-full badges e pills.
Sombras sm em cards, xl em modais. Espaçamento base 4 (gap-4, p-4/p-6).

## Components
`.btn-primary`, `.btn-secondary`, `.btn-danger`, `.input-field`, `.label`,
`.card`, `.table-header`, `.table-cell`, `.badge` (+success/warning/danger/info).
Tabelas: header uppercase text-xs, linhas hover, paginação Anterior/Próximo.
Modais centralizados com overlay. Toasts top-right (lazy).