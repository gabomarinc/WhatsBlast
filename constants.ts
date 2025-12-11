export const APP_NAME = "HumanFlow";
export const WELCOME_MSG = "Vamos a hacer tu prospección más humana y simple ✨";

// Used for variable suggestions in the template editor
export const DEFAULT_VARIABLES = ['nombre', 'apellido', 'empresa'];

export const MOCK_PROSPECTS = [
  {
    id: '1',
    nombre: 'Ana',
    apellido: 'García',
    telefono: '5215555555555',
    empresa: 'Tech Solutions',
    estado: 'Pendiente',
    interes: 'Alto'
  },
  {
    id: '2',
    nombre: 'Carlos',
    apellido: 'Ruiz',
    telefono: '5215555555556',
    empresa: 'Marketing Pro',
    estado: 'Contactado',
    interes: 'Medio'
  },
  {
    id: '3',
    nombre: 'Luisa',
    apellido: 'Méndez',
    telefono: '5215555555557',
    empresa: 'Design Studio',
    estado: 'Nuevo',
    interes: 'Bajo'
  }
];

export const DEFAULT_TEMPLATE = "Hola {{nombre}}, vi que en {{empresa}} están buscando innovar. ¿Podemos charlar?";
