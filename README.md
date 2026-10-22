This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## UI components

This project uses shadcn/ui with Tailwind CSS v4. Shared components are in `components/ui`, and their settings are in `components.json`.

Add more components with:

```bash
npx shadcn@latest add <component>
```

## WhatsApp para coordinar pedidos

Al crear un pedido desde el carrito, el comprador puede abrir WhatsApp con un mensaje preparado que incluye los datos del cliente, la entrega, los productos y el total. El comprador debe pulsar **Enviar** en WhatsApp; la web no envía mensajes automáticamente.

Configura `WHATSAPP_ORDER_PHONE` con el número de destino en formato internacional, solo dígitos y sin `+` (por ejemplo, `584121234567`). En desarrollo se configura en `.env.local`; en producción debe añadirse como variable de entorno del despliegue.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
