# VastuFlow

**Ancient Geometry. Modern Precision.** 

VastuFlow is an advanced, deterministic web application designed for Vastu Shastra consultants, architects, and designers. It allows users to upload intricate floor plans, accurately trace layouts with precise measurements, map out the 16 Vastu directional zones (Shakti Chakra), compute internal energy nodes (Marmas) to prevent structural overlap, and generate perfectly scored, branded PDF analysis reports directly from the browser. 

Unlike conventional architectural softwares that rely on approximations, VastuFlow builds entirely on pure Cartesian mathematics and geometric sector intersection algorithms running offline-capable within the client browser. 

---

## 🏗️ Core Features

- **Interactive Map Builder & Tracer**: Construction grid built to scale. Tracing functionality that seamlessly maps uploaded PDFs or images of floor plans into mathematically valid closed polygon domains.
- **Parametric Geometric Alignment**: A robust compass overlay tool that allows you to designate exact rotational coordinates tying True North to the geometric grid.
- **16-Zone Shakti Chakra Overlay**: An auto-generated ray-casting chakra overlay computing exactly which zones influence which parts of the polygon bounding box, evaluating deviations automatically.
- **32 Entrance Devta Analysis**: Precision placement of the 32 deities on the outer rim of the property line based on pure geometric degree angles from the exact computed centroid.
- **Zero-Dependency Math Engine**: Built strictly utilizing algorithms such as the Shoelace Formula (for polygon area), precise ray-polygon bounding (for line intersections), and dynamic clipping. 
- **Client-Side Processing**: Fully deterministic mathematical operations run entirely in the browser utilizing `CanvasArea` SVGs meaning NO user maps are ever sent to an external server.
- **AI Remedy Integration**: Features an API layer using Groq to intelligently generate Vastu remedies and spatial correctional guidance for sub-optimal item placements based dynamically on the 16 directional outcomes.
- **Professional PDF Exports**: Generate clean, branded PDF reports containing both the visual overlay maps, zone-by-zone scores, and generated remedies for client presentations.

---

## 🛠️ Tech Stack & Architecture

- **Frontend Framework:** Next.js (React 18) 
- **Styling:** Vanilla CSS, TailwindCSS (for utility generation)
- **State Management:** Complex React `useReducer` combined with strong Context encapsulations handling Phase transitions (Idle, Tracing, Alignment, Analysis, etc.).
- **Vector & Geometry:** Pure SVG mathematics and custom TypeScript logic matrices handling geometric intersects natively on the client grid.
- **Animations:** Anime.js & Framer Motion for premium user interfaces and dynamic timeline landing pages.
- **PDF Generation:** `jspdf` integrated with canvas snapshot techniques for crystal-clear render exports.
- **Deployments:** Optimized for Vercel edge networks.

---

## ⚙️ Getting Started & Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Nirmit-Angane/Vastuflow.git
   cd Vastuflow/vastuflow-app
   ```

2. **Install dependencies:**
   Make sure to be inside the `vastuflow-app` directory since this project utilizes a monorepo-style structure. 
   ```bash
   npm install
   ```
   *(Note: This project relies on React 18 syntax.)*

3. **Configure the Environment:**
   If you plan to utilize the AI Remedy Generator, you need a Groq API Key.
   Create a `.env.local` file inside `vastuflow-app/`:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and add your secure API Key:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

5. **Load up the Workspace:** 
   Open your browser and navigate to `http://localhost:3000/workspace`. 

---

## 🧩 How It Works (The Workflow Pipeline)

1. **Upload Phase**: Users provide a structural image or blueprint PDF. `pdfjs-dist` parses the vector inputs directly into standard image arrays.
2. **Alignment & Tracing**: By setting up an initial edge-line calibration to a real-world distance (i.e. setting a line equal to 10 feet), the entire grid auto-maps its Cartesian domain identically to real-footprint coordinates. Polygon tracing closes the geometric loop for the building's physical boundary.
3. **Geometry Calculation**: 
   - `computeCentroid()` evaluates the polygon utilizing Shoelace coordinate mechanics.
   - The engine generates 16 radial sectors extending from the newly calculated exact architectural center.
4. **Analysis Generation**: A ray object casts out dynamically and clips against the boundary edges inside `CanvasArea`. Floor layout elements such as doors, objects, and text items passed through the `ProjectState` reducer are validated against the 16 zones utilizing the local constants within `VASTU_PLACEMENT_RULES`. Overlaps, positive hits, and structural blockages are flagged immediately for the HUD report structure.

---

## 📐 Vastu Core Mathematics Reference  

Key logic functions powering the mathematical engine can be found mapped inside `/src/core/geometry/`:
- **`polygon.ts`**: Contains the core logic for spatial boundaries, computing absolute centroids, determining coordinate bounds within `SVG` contexts, and polygon validation algorithms (Shoelace Algorithm).
- **`sectors.ts`**: Handles the calculations dictating standard angular division mapped to 16 directional slices.
- **`overlap.ts`**: Incredibly complex ray-intersect calculations to evaluate exact pixel and degree-based overlap areas inside the generated zones versus the boundaries derived in the trace phase.
- **`devtas.ts`**: Evaluates boundary zones on a 360-degree basis mapping to the outer 32 nodes for deity entrance logic.
- **`vastu-rules.ts`**: The strict rule dictionary containing exactly what placement counts as a defect (dosh) vs positive flow. 

---

## 📜 License & Copyright

Designed and engineered for accuracy and aesthetic UI progression. For internal distribution or modifications, please reference standard MIT protocols.
