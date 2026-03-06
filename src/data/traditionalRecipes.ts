import { Recipe } from "../types";

export const TRADITIONAL_RECIPES: Partial<Recipe>[] = [
  {
    title: "Aceitunas Partías",
    description: "Receta tradicional de Domingo Gómez Sánchez para preparar aceitunas aliñadas.",
    category: "Snack",
    ingredients: ["Aceitunas", "Olivardilla", "Hinojos", "Hojas de garrofero", "Agua", "Sal"],
    instructions: [
      "Partir y lavar bien las aceitunas.",
      "Mantener en un recipiente con agua durante 48 horas para purgar la acidez.",
      "Lavar otra vez y poner en otro recipiente para arreglarlas.",
      "Añadir olivardilla, hinojos y hojas de garrofero.",
      "Preparar agua con sal: para saber la salinidad correcta, poner un huevo en el agua y añadir sal hasta que la corona del huevo flote un poco.",
      "A los tres días ya se pueden comer."
    ],
    nutritionalValue: { calories: 150, protein: 1, carbs: 4, fat: 15 },
    isPublic: true
  },
  {
    title: "Ajo de Mortero",
    description: "Clásico alioli tradicional de Juana Ros Ros.",
    category: "Snack",
    ingredients: ["2 cabezas de ajo", "1,5 L. de aceite de oliva", "Limón", "Sal"],
    instructions: [
      "Pelar los ajos y picarlos muy bien en el mortero.",
      "Cuando estén bien picados, ir añadiendo aceite muy lentamente.",
      "Mover con la mano del mortero despacio, siempre en el mismo sentido.",
      "Añadir limón y sal al gusto."
    ],
    nutritionalValue: { calories: 450, protein: 0, carbs: 2, fat: 50 },
    isPublic: true
  },
  {
    title: "Almejas con Almendras y Perejil",
    description: "Entrante marinero de Encarna Pedreño.",
    category: "Lunch",
    ingredients: ["500 g. de almejas", "250 g. de almendras", "Un manojo de perejil", "Aceite de oliva"],
    instructions: [
      "Freír las almendras con un poco de sal y picarlas.",
      "Poner las almejas en una sartén amplia con un poco de aceite hasta que se abran.",
      "Añadir el perejil y las almendras picadas.",
      "Mezclar todo bien para integrar los sabores y servir."
    ],
    nutritionalValue: { calories: 320, protein: 18, carbs: 10, fat: 24 },
    isPublic: true
  },
  {
    title: "Brazo de Pisto",
    description: "Receta de Pepita Aniorte Navarro usando pan de molde y atún.",
    category: "Lunch",
    ingredients: ["1 paquete de pan de molde", "2 botes de fritada en conserva", "2 latas de atún", "3 huevos duros", "Bechamel", "Queso rallado"],
    instructions: [
      "En un molde, colocar una fila de pan de molde.",
      "Añadir la fritada mezclada con los huevos picados y el atún.",
      "Repetir las capas de pan y relleno tantas veces como se quiera.",
      "Terminar con una capa de pan de molde.",
      "Cubrir con bechamel y queso rallado.",
      "Gratinar en el horno."
    ],
    nutritionalValue: { calories: 380, protein: 15, carbs: 40, fat: 18 },
    isPublic: true
  },
  {
    title: "Pastel de Cierva",
    description: "Famoso pastel dulce-salado de Pepita Sánchez Bernal.",
    category: "Lunch",
    ingredients: ["1/2 Kg. de carne de pollo", "1/2 Kg. de manteca de cerdo", "1 huevo fresco", "3 huevos cocidos", "1/2 Kg. de azúcar", "3/4 Kg. de harina", "Raspadura de limón", "Canela", "1 sobre de levadura", "Caldo de pollo"],
    instructions: [
      "Hacer una masa con harina, levadura, azúcar, manteca, el huevo fresco, limón y canela.",
      "Dividir la masa en dos. Forrar un molde con la mitad.",
      "Cocer el pollo con apio y puerro. Trocear y añadir un poco de caldo.",
      "Rellenar el molde con el pollo y los huevos cocidos picados.",
      "Cubrir con la otra mitad de la masa y sellar bien.",
      "Pintar con huevo y hornear a 190° durante 1 hora y media."
    ],
    nutritionalValue: { calories: 550, protein: 20, carbs: 60, fat: 30 },
    isPublic: true
  },
  {
    title: "Aletría",
    description: "Guiso tradicional de fideos de Antonia Peña Beneyto.",
    category: "Lunch",
    ingredients: ["1/2 Kg. de costillejas", "1 Kg. de patatas", "150 g. de fideos gordos", "1 pimiento rojo", "2 alcaciles", "4 ajos", "1 tomate", "1 cebolla pequeña", "Pimentón", "Comino", "Azafrán", "Perejil"],
    instructions: [
      "Freír la carne. Hacer un sofrito con las verduras (pimiento, cebolla, alcaciles, tomate).",
      "Trocear patatas y poner en una olla con la carne y el sofrito. Cubrir con agua y hervir.",
      "Picar ajos, perejil y cominos y añadir al guiso.",
      "Cuando las patatas estén a medio hacer, añadir los fideos y el azafrán."
    ],
    nutritionalValue: { calories: 420, protein: 22, carbs: 45, fat: 16 },
    isPublic: true
  },
  {
    title: "Arroz con Conejo",
    description: "Arroz campero de Cándida Cervantes Ros.",
    category: "Lunch",
    ingredients: ["1 conejo de 1,5 Kg.", "Pimiento rojo y verde", "1 cabeza de ajos", "2 tomates grandes", "800 g. de arroz", "Perejil", "Azafrán de pelo", "Sal", "Aceite"],
    instructions: [
      "Sofreír pimientos y ajos. Apartar.",
      "Sofreír el conejo troceado. Hervir el conejo.",
      "Hacer un majado con el hígado del conejo, ajos, pimientos, perejil y azafrán.",
      "Añadir el majado al conejo hervido.",
      "Añadir el arroz a la paellera con el caldo, rectificar de sal y azafrán.",
      "Cocinar unos 20 minutos."
    ],
    nutritionalValue: { calories: 480, protein: 25, carbs: 65, fat: 12 },
    isPublic: true
  },
  {
    title: "Migas",
    description: "Migas de harina tradicionales de Antonio Muñoz López.",
    category: "Lunch",
    ingredients: ["Harina", "Longaniza blanca y roja", "Tocino magroso", "Ajos", "Sal", "Aceite", "Agua"],
    instructions: [
      "Freír la longaniza, el tocino y los ajos. Reservar.",
      "Amasar la harina con agua y sal.",
      "Poner en una sartén con aceite caliente y trabajar con dos raseras hasta que se suelten y se doren.",
      "Añadir el embutido y los ajos al final y terminar a fuego lento."
    ],
    nutritionalValue: { calories: 520, protein: 12, carbs: 70, fat: 22 },
    isPublic: true
  },
  {
    title: "Alfajores de Chocolate",
    description: "Dulce navideño de Andrea Navarro Navarro.",
    category: "Snack",
    ingredients: ["1 kg. de almendras", "1 kg. de azúcar", "2 paquetes de galletas María", "1 bolsa de rosquillas de pan", "2 tabletas de chocolate negro", "1/2 litro de miel", "125 ml. de anís seco"],
    instructions: [
      "Moler almendras, galletas y rosquillas.",
      "Añadir chocolate rallado, miel, azúcar y anís. Mezclar bien con batidora.",
      "Dar forma de alfajor y pasar por azúcar glas.",
      "Envolver en papel de colores. Dejar reposar un día."
    ],
    nutritionalValue: { calories: 280, protein: 5, carbs: 45, fat: 10 },
    isPublic: true
  },
  {
    title: "Arroz con Leche",
    description: "Postre clásico de Maruja García Garre.",
    category: "Snack",
    ingredients: ["1,5 L. de leche", "200 g. de arroz", "200 g. de azúcar", "Canela en rama y molida", "Corteza de limón"],
    instructions: [
      "Cocer la leche con el arroz, la canela en rama y la corteza de limón.",
      "Cuando el arroz esté casi cocido, añadir el azúcar.",
      "Remover sin parar hasta que espese al gusto.",
      "Servir en cazuelitas con canela molida por encima."
    ],
    nutritionalValue: { calories: 250, protein: 6, carbs: 48, fat: 4 },
    isPublic: true
  },
  {
    title: "Salsa de Magra con Pésoles",
    description: "Guiso de carne con guisantes de Paquita García García.",
    category: "Lunch",
    ingredients: ["1 Kg. de magra de cerdo en tacos", "1/2 Kg. de pésoles (guisantes)", "1 tomate", "1 cebolla", "3 dientes de ajo", "Vino blanco", "Sal", "Aceite", "Nuez moscada"],
    instructions: [
      "Freír la carne y poner en una cacerola con los pésoles, agua y vino blanco. Hervir.",
      "Aparte, sofreír cebolla, ajos y tomate.",
      "Añadir el sofrito a la cacerola con sal y nuez moscada rallada.",
      "Dejar reducir hasta que la carne esté tierna."
    ],
    nutritionalValue: { calories: 410, protein: 28, carbs: 15, fat: 22 },
    isPublic: true
  },
  {
    title: "Crema Catalana",
    description: "Postre tradicional de Trinidad Segado Tomás.",
    category: "Snack",
    ingredients: ["1 L. de leche", "6 yemas de huevo", "200 g. de azúcar", "Canela", "2 cucharadas de harina de maíz", "Piel de un limón"],
    instructions: [
      "Hervir la leche con la piel de limón.",
      "Cuando enfríe, añadir yemas, azúcar y maicena.",
      "Triturar y poner al fuego sin parar de remover hasta que espese (sin hervir).",
      "Repartir en recipientes y quemar azúcar por encima."
    ],
    nutritionalValue: { calories: 320, protein: 8, carbs: 45, fat: 12 },
    isPublic: true
  }
];
