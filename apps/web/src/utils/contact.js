export const whatsappUrl = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : null;
};
