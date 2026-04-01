import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../lib/db/schema";

const db = drizzle(process.env.DATABASE_URL!, { schema });

const seedPrayers = [
  {
    text: "Mi mamá entra a cirugía mañana. Por favor oren por las manos del doctor y por paz para nuestra familia.",
    displayName: "Carlos",
    isAnonymous: false,
    category: "health",
  },
  {
    text: "Llevo 3 meses sin trabajo. Necesito proveer para mis hijos. Confío en Dios pero la ansiedad me gana.",
    displayName: null,
    isAnonymous: true,
    category: "work",
  },
  {
    text: "My marriage is going through a really hard season. We need wisdom and patience with each other.",
    displayName: "David",
    isAnonymous: false,
    category: "family",
  },
  {
    text: "Oren por mi hijo adolescente. Se ha alejado mucho de nosotros y de Dios. No sé cómo acercarme a él.",
    displayName: "Lupita",
    isAnonymous: false,
    category: "family",
  },
  {
    text: "I'm struggling with anxiety and it's affecting my sleep. Pray that God gives me rest and peace.",
    displayName: null,
    isAnonymous: true,
    category: "health",
  },
  {
    text: "Gracias Señor por la beca que recibió mi hija. Oré por esto durante meses.",
    displayName: "Roberto",
    isAnonymous: false,
    category: "gratitude",
  },
  {
    text: "Tengo una entrevista de trabajo el viernes. Oren para que Dios abra las puertas correctas.",
    displayName: "Ana",
    isAnonymous: false,
    category: "work",
  },
  {
    text: "Pray for our church plant. We're a small group but we believe God has a plan for this community.",
    displayName: "James",
    isAnonymous: false,
    category: "spiritual",
  },
  {
    text: "Mi esposo fue diagnosticado con diabetes. Estamos asustados. Necesitamos fe.",
    displayName: null,
    isAnonymous: true,
    category: "health",
  },
  {
    text: "I feel far from God lately. Not sure why. Just asking for prayer to feel His presence again.",
    displayName: null,
    isAnonymous: true,
    category: "spiritual",
  },
  {
    text: "Oren por los niños del albergue donde sirvo. Muchos no tienen familia. Que Dios los cubra.",
    displayName: "Marta",
    isAnonymous: false,
    category: "general",
  },
  {
    text: "My dad passed away last week. I know he's with the Lord but the grief is heavy. Pray for strength.",
    displayName: "Sarah",
    isAnonymous: false,
    category: "family",
  },
  {
    text: "Necesito sabiduría para una decisión grande. No sé si mudarme o quedarme. Que Dios me guíe.",
    displayName: null,
    isAnonymous: true,
    category: "general",
  },
  {
    text: "Pray for peace in my mind. Intrusive thoughts have been getting worse and I feel ashamed.",
    displayName: null,
    isAnonymous: true,
    category: "health",
  },
  {
    text: "Mi hermana va a tener su bebé prematuro. Oren por el bebé y por ella. Tienen 32 semanas.",
    displayName: "Diego",
    isAnonymous: false,
    category: "health",
  },
  {
    text: "Estoy comenzando un negocio pequeño para sostener a mi familia. Que Dios bendiga el trabajo de mis manos.",
    displayName: "Josué",
    isAnonymous: false,
    category: "work",
  },
  {
    text: "Thank God for healing. The biopsy came back negative. He is faithful.",
    displayName: "Michelle",
    isAnonymous: false,
    category: "gratitude",
  },
  {
    text: "Oren por mi matrimonio. Llevamos un año difícil pero queremos luchar por nuestra familia.",
    displayName: null,
    isAnonymous: true,
    category: "family",
  },
  {
    text: "I'm a college student and I feel so alone. Pray that I find a church community here.",
    displayName: "Josh",
    isAnonymous: false,
    category: "spiritual",
  },
  {
    text: "Por favor oren por mi papá. Tiene Alzheimer y cada día es más difícil. Necesitamos fuerzas.",
    displayName: "Valentina",
    isAnonymous: false,
    category: "health",
  },
];

async function seed() {
  console.log("Seeding prayers...");

  for (const prayer of seedPrayers) {
    await db.insert(schema.prayers).values(prayer);
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`Seeded ${seedPrayers.length} prayers.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
