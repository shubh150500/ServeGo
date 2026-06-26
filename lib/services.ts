export interface ServiceDetails {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  assuranceFee: number;
  iconName: string;
  benefits: string[];
  subServices: string[];
  faq: { question: string; answer: string }[];
  type?: "home" | "partner" | "vehicle";
}

export const SERVICES_LIST: ServiceDetails[] = [
  {
    id: "electrician",
    name: "Electrician",
    shortDescription: "Certified professionals for wiring, repairs, and installations.",
    description: "Our certified electricians are fully trained to handle residential and commercial electrical tasks, ensuring complete safety and compliance.",
    assuranceFee: 99,
    iconName: "Zap",
    benefits: [
      "Background-checked & certified electricians",
      "Modern troubleshooting equipment",
      "Upfront quotes with no hidden costs",
      "30-day warranty on all repairs"
    ],
    subServices: [
      "Fan, light, and socket installations",
      "Short circuit & wiring diagnostics",
      "Inverter & UPS installation",
      "Switchboard repairs & replacements"
    ],
    faq: [
      {
        question: "Are your electricians licensed?",
        answer: "Yes, all our electricians are certified professionals with verified background checks and at least 3 years of hands-on experience."
      },
      {
        question: "Is there a warranty on electrical repairs?",
        answer: "We offer a 30-day service warranty on all electrical repairs and installations completed through our platform."
      }
    ]
  },
  {
    id: "plumber",
    name: "Plumber",
    shortDescription: "Expert plumbers for leakages, fittings, and drain cleaning.",
    description: "Get immediate assistance from professional plumbers for water leaks, tap repairs, bathroom fittings, and sewer blockages.",
    assuranceFee: 99,
    iconName: "Droplet",
    benefits: [
      "Quick response time",
      "Equipped with advanced tools",
      "Transparent pricing structure",
      "Post-service cleanup included"
    ],
    subServices: [
      "Leaking tap and pipe repairs",
      "Bathroom & kitchen fittings",
      "Drainage and clog clearing",
      "Water tank cleaning & installation"
    ],
    faq: [
      {
        question: "Do you supply the plumbing spare parts?",
        answer: "Our workers carry standard tools and consumable items. Any major replacement parts (like taps, valves, or pipes) can be purchased by you or sourced by the worker with a proper invoice."
      }
    ]
  },
  {
    id: "carpenter",
    name: "Carpenter",
    shortDescription: "Custom furniture work, repairs, and fittings.",
    description: "Hire skilled carpenters for wooden furniture assembly, lock repairs, hinges adjustment, and custom cabinetry.",
    assuranceFee: 149,
    iconName: "Hammer",
    benefits: [
      "Expert woodwork craftsmen",
      "Precise measurements and finish",
      "Assistance with material selection",
      "Door lock repairs and keys check"
    ],
    subServices: [
      "Furniture assembly & repair",
      "Door lock and handle installation",
      "Cabinet and drawer fitting fixes",
      "Custom wooden shelving creation"
    ],
    faq: [
      {
        question: "Can you help assemble furniture bought online?",
        answer: "Absolutely! Our carpenters are experts at assembling flat-pack furniture from IKEA, Amazon, and other major retailers."
      }
    ]
  },
  {
    id: "painter",
    name: "Painter",
    shortDescription: "Full house, wall, and stencil painting service.",
    description: "Transform your spaces with our professional home painting services, covering interior walls, exteriors, texture coatings, and waterproofing.",
    assuranceFee: 199,
    iconName: "Paintbrush",
    benefits: [
      "Premium paint brands used",
      "Dust-free preparation & coverage",
      "On-time completion track record",
      "Wall dampness check and treatment"
    ],
    subServices: [
      "Interior wall painting",
      "Exterior home painting",
      "Wall waterproofing treatment",
      "Texture coating & stencil design"
    ],
    faq: [
      {
        question: "How long does a painting job take?",
        answer: "A standard 2 BHK interior painting takes about 3-5 days. We provide a detailed timeline prior to starting the work."
      }
    ]
  },
  {
    id: "labour",
    name: "Labour / Helper",
    shortDescription: "Manual labor for shifting, loading, and cleaning.",
    description: "Get general manual labor assistance for shifting items, heavy loading, garden cleanup, construction support, and other daily-wage tasks.",
    assuranceFee: 99,
    iconName: "UserCheck",
    benefits: [
      "Physically fit and reliable workers",
      "Hourly or daily wage basis",
      "Flexible task assignment",
      "Instant allocation"
    ],
    subServices: [
      "Heavy load lifting and shifting",
      "Debris removal and site cleanup",
      "Garden preparation & digging",
      "Event setup and dismantling support"
    ],
    faq: [
      {
        question: "Do they bring their own loading tools?",
        answer: "General helpers do not carry heavy specialized lifting machinery. Please provide instructions on required tools during the booking."
      }
    ]
  },
  {
    id: "mason",
    name: "Mason / Tile Worker",
    shortDescription: "Tile installation, plastering, and brickwork.",
    description: "Professional masonry work including tile/marble installations, concrete repairs, wall plastering, and stone masonry.",
    assuranceFee: 149,
    iconName: "Grid",
    benefits: [
      "Accurate tile alignment and cutting",
      "High-grade cement mixing ratios",
      "Sturdy brickwork structure build",
      "Crack repair & finishing expertise"
    ],
    subServices: [
      "Wall and floor tile installation",
      "Brickwork and wall construction",
      "Concrete plastering & waterproofing",
      "Marble & granite cutting & fitting"
    ],
    faq: [
      {
        question: "Do you lay floor tiles for bathrooms?",
        answer: "Yes, our masons are experts in slope alignment and waterproofing for bathroom floors and wall tiles."
      }
    ]
  },
  {
    id: "welder",
    name: "Welder / Fabricator",
    shortDescription: "Metal gate, grill, and structure welding.",
    description: "On-site welding repairs and custom metal fabrication services for steel, iron, and aluminum structures.",
    assuranceFee: 149,
    iconName: "Flame",
    benefits: [
      "Precision arc & gas welding",
      "Heavy-duty metal cutting gear",
      "Rust treatment of welded spots",
      "Door and gate latch alignment"
    ],
    subServices: [
      "Iron gate and window grill repair",
      "Metal frame fabrication",
      "Staircase railing welding",
      "Aluminum door bracket repair"
    ],
    faq: [
      {
        question: "Do you offer on-site welding?",
        answer: "Yes, our welders carry portable welding machines to execute the job directly at your premises."
      }
    ]
  },
  {
    id: "ac-repair",
    name: "AC Repair & Service",
    shortDescription: "AC filter cleaning, gas refill, and diagnostics.",
    description: "Keep cool with expert split & window AC repair, deep jet-pump cleaning, gas leak detection, and compressor repair.",
    assuranceFee: 149,
    iconName: "Wind",
    benefits: [
      "High-pressure jet pump cleaning",
      "Genuine replacement parts",
      "Gas leak detection and sealing",
      "Power consumption diagnostics"
    ],
    subServices: [
      "Deep filter & coil service",
      "AC gas charging / refilling",
      "Compressor repair & replacement",
      "AC mounting and uninstallation"
    ],
    faq: [
      {
        question: "How often should I service my AC?",
        answer: "We recommend getting a professional service twice a year—once before the peak summer season and once after."
      }
    ]
  },
  {
    id: "ro-repair",
    name: "RO & Water Purifier",
    shortDescription: "Filter replacements, water testing, and repair.",
    description: "Ensure safe drinking water with timely RO filter replacement, membrane diagnostics, and TDS level adjustment.",
    assuranceFee: 99,
    iconName: "ShieldAlert",
    benefits: [
      "TDS water quality check included",
      "High-grade replacement membranes",
      "Leakage proofing of supply pipes",
      "Annual Maintenance Contract support"
    ],
    subServices: [
      "Pre-filter and carbon filter change",
      "RO membrane diagnosis & service",
      "Pump repair and solenoid check",
      "Water TDS level calibration"
    ],
    faq: [
      {
        question: "How do I know my RO filters need replacement?",
        answer: "If you notice a change in water taste, a drop in water flow rate, or if it has been more than 12 months since the last service."
      }
    ]
  },
  {
    id: "cctv",
    name: "CCTV Installation",
    shortDescription: "Security camera setup, wiring, and config.",
    description: "Protect your property with premium CCTV camera installations, DVR config, mobile app integration, and wire routing.",
    assuranceFee: 199,
    iconName: "Video",
    benefits: [
      "Optimal camera angle placement",
      "Neat wire conduit routing",
      "Mobile viewing configuration",
      "1-year support on connection issues"
    ],
    subServices: [
      "IP and Analog camera installation",
      "DVR / NVR setup and config",
      "Mobile app sync for live feed",
      "Faulty camera/cable diagnosis"
    ],
    faq: [
      {
        question: "Can I view the CCTV feed on my mobile phone?",
        answer: "Yes, our technicians will configure the DVR/NVR to connect to your home internet so you can view live feeds on your phone."
      }
    ]
  },
  {
    id: "cleaning",
    name: "House Cleaning",
    shortDescription: "Deep home, kitchen, and bathroom cleaning.",
    description: "Professional home cleaning including kitchen degreasing, bathroom sanitization, floor scrubbing, and window dusting.",
    assuranceFee: 149,
    iconName: "Sparkles",
    benefits: [
      "Industrial grade cleaning agents",
      "Deep disinfection of surfaces",
      "Trained professional cleaners",
      "Complete stains and grease removal"
    ],
    subServices: [
      "Full home deep cleaning",
      "Kitchen deep cleaning & degreasing",
      "Bathroom descaling & sanitization",
      "Sofa and carpet vacuuming"
    ],
    faq: [
      {
        question: "Do cleaners bring their own materials?",
        answer: "Yes, our team brings all professional cleaning chemicals, scrubber machines, vacuum cleaners, and wipes."
      }
    ]
  },
  {
    id: "pest-control",
    name: "Pest Control",
    shortDescription: "Cockroach gel, termite, and mosquito spray.",
    description: "Keep bugs away with odorless pest treatments targeting cockroaches, bedbugs, termites, and rodents.",
    assuranceFee: 149,
    iconName: "Bug",
    benefits: [
      "Government-approved safe chemicals",
      "Odorless & pet-friendly options",
      "100% eradication assurance",
      "Free follow-up inspection check"
    ],
    subServices: [
      "Cockroach gel & herbal treatment",
      "Termite protection & barrier setup",
      "Bedbug intensive spray treatment",
      "General disinfection & sanitization"
    ],
    faq: [
      {
        question: "Is it safe for pets and children?",
        answer: "We use non-toxic, odorless, and government-approved chemicals. However, we advise keeping children and pets away from treated areas for 2-4 hours."
      }
    ]
  },
  {
    id: "movers",
    name: "Movers & Packers",
    shortDescription: "Safe household packing and local shifting.",
    description: "Stress-free relocation services. Professional packing, loading, transport, unloading, and unpacking of your household items.",
    assuranceFee: 299,
    iconName: "Truck",
    benefits: [
      "Multi-layer bubble wrap packing",
      "Closed container transport vehicle",
      "Experienced packing staff",
      "Transit safety assurance"
    ],
    subServices: [
      "Local household item shifting",
      "Office furniture shifting",
      "Heavy appliance packing & transport",
      "Relocation unpacking & assembly"
    ],
    faq: [
      {
        question: "Do you provide carton boxes?",
        answer: "Yes, we provide high-quality multi-ply carton boxes, bubble wraps, tapes, and stretch films as part of the package."
      }
    ]
  },
  {
    id: "medical-shops",
    name: "Medical Shops",
    shortDescription: "Verified pharmacies and medical shops with home delivery.",
    description: "Find pharmacies and medicine shops near you. Get medicines, healthcare products, and wellness essentials delivered straight to your door.",
    assuranceFee: 49,
    iconName: "Pill",
    benefits: [
      "100% genuine medicines guaranteed",
      "Fast home delivery options",
      "Accurate prescription reading",
      "Verified local stores"
    ],
    subServices: [
      "Prescription Medicines",
      "OTC Drugs & Health Products",
      "Baby Care & Wellness",
      "Surgicals & First Aid"
    ],
    faq: [
      {
        question: "Can I order prescription medicines?",
        answer: "Yes, you will need to upload or present a valid doctor's prescription when placing orders or when the delivery partner arrives."
      }
    ],
    type: "partner"
  },
  {
    id: "grocery-kirana-shops",
    name: "Rasan (Grocery)",
    shortDescription: "Local kirana and grocery stores for daily essentials.",
    description: "Get grocery, fresh items, household supplies, and daily essentials from trusted local kirana and supermarket partners.",
    assuranceFee: 49,
    iconName: "ShoppingBag",
    benefits: [
      "Fresh quality items assured",
      "Local store prices and discounts",
      "Quick same-day home delivery",
      "Flexible ordering on WhatsApp"
    ],
    subServices: [
      "Daily Essentials & Rasan",
      "Fresh Fruits & Vegetables",
      "Beverages & Snacks",
      "Household & Cleaning Products"
    ],
    faq: [
      {
        question: "Is there a minimum order value?",
        answer: "Minimum order values are set by individual shops, but generally, local stores deliver orders above ₹200."
      }
    ],
    type: "partner"
  },
  {
    id: "restaurants",
    name: "Local Restaurants",
    shortDescription: "Top-rated local dining and quick delivery food partners.",
    description: "Order delicious meals, breakfast, and fast food from the best restaurants and eateries in your local area.",
    assuranceFee: 49,
    iconName: "Utensils",
    benefits: [
      "Freshly prepared delicious food",
      "Hygienically packaged meals",
      "Super fast delivery",
      "Wide range of local cuisines"
    ],
    subServices: [
      "Lunch & Dinner Meals",
      "Breakfast & Evening Snacks",
      "Fast Food & Desserts",
      "Local Specialties"
    ],
    faq: [
      {
        question: "How long does food delivery take?",
        answer: "Food delivery typically takes 30-45 minutes depending on your distance from the restaurant."
      }
    ],
    type: "partner"
  },
  {
    id: "building-material-shops",
    name: "Building Material Shops",
    shortDescription: "Cement, sand, bricks, steel, and structural supplies.",
    description: "Source high-quality construction materials, including cement, bricks, sand, aggregate, and steel, from verified local building material suppliers.",
    assuranceFee: 199,
    iconName: "Construction",
    benefits: [
      "Genuine grade materials",
      "Competitive market rates",
      "Bulk delivery to construction sites",
      "Accurate weight and volume verification"
    ],
    subServices: [
      "High-grade Cement & Sand",
      "Red Bricks & Hollow Blocks",
      "Structural TMT Steel Bars",
      "Aggregate & Stone Dust"
    ],
    faq: [
      {
        question: "Are delivery charges included in material cost?",
        answer: "Usually, unloading and delivery charges depend on the site distance and order quantity and will be confirmed by the supplier."
      }
    ],
    type: "partner"
  },
  {
    id: "centring-material-suppliers",
    name: "Centering Services",
    shortDescription: "Iron plates, wooden planks, and props for construction.",
    description: "Rent centering materials, concrete shuttering plates, wooden planks, adjustable steel props, and scaffolding equipment from certified suppliers.",
    assuranceFee: 299,
    iconName: "Layers",
    benefits: [
      "Heavy-duty shuttering plates",
      "Sturdy steel props & spans",
      "Flexible rental durations",
      "On-time site delivery & pickup"
    ],
    subServices: [
      "Concrete Shuttering Plates",
      "Adjustable Steel Props (Jack)",
      "Wooden Planks & H-Beams",
      "Scaffolding & Cup-lock Systems"
    ],
    faq: [
      {
        question: "What is the minimum rental duration?",
        answer: "Shuttering and scaffolding equipment are typically rented on a monthly or daily basis. You can discuss flexible durations with the assigned partner."
      }
    ],
    type: "partner"
  },
  {
    id: "hardware-shops",
    name: "Hardware Shops",
    shortDescription: "Paints, pipes, screws, electrical fittings, and tools.",
    description: "Shop for premium hardware tools, plumbing fixtures, electrical switches, paints, bolts, and repair accessories from local partners.",
    assuranceFee: 99,
    iconName: "Wrench",
    benefits: [
      "Wide inventory of major brands",
      "Genuine tools & accessories",
      "Expert counter guidance",
      "Fast pickup or delivery options"
    ],
    subServices: [
      "Plumbing Pipes & Fittings",
      "Electrical Switches & Cables",
      "Paints & Painting Tools",
      "Hand Tools & Fasteners"
    ],
    faq: [
      {
        question: "Do you deliver small items like nails or switches?",
        answer: "Yes, many of our local hardware partners offer home delivery for a small delivery fee or free above a certain order value."
      }
    ],
    type: "partner"
  },
  {
    id: "vehicle-sedan",
    name: "Sedan Rental",
    shortDescription: "Comfortable 5-seater sedans for city and outstation travel.",
    description: "Rent premium, well-maintained sedans for business trips, family travel, outstation journeys, or daily commutes with professional drivers.",
    assuranceFee: 199,
    iconName: "Car",
    benefits: [
      "Clean and sanitized cabins",
      "Professional, verified drivers",
      "Transparent pricing (per km/hour)",
      "24/7 road assistance support"
    ],
    subServices: [
      "Local City Travel (8hr/80km)",
      "Outstation Round Trips",
      "Airport Pickup & Dropoff",
      "Hourly Rental Packages"
    ],
    faq: [
      {
        question: "Are fuel charges included in the price?",
        answer: "Fuel policy varies by rental package. It can be per-km inclusive of fuel, or guest-fueled. Details will be provided during coordination."
      }
    ],
    type: "vehicle"
  },
  {
    id: "vehicle-suv",
    name: "SUV Rental",
    shortDescription: "Spacious 7-seater SUVs for family trips and rough roads.",
    description: "Rent powerful 7-seater SUVs (like Creta, Innova, Scorpio) for comfortable long-distance travel, family tours, and rough terrains.",
    assuranceFee: 299,
    iconName: "Car",
    benefits: [
      "Generous legroom & luggage space",
      "Top-tier vehicle condition",
      "Experienced highway drivers",
      "AC/Non-AC customizable options"
    ],
    subServices: [
      "Family Outstation Trips",
      "Rough Terrain Travel",
      "Wedding/Event VIP transport",
      "Full-Day Local Charter"
    ],
    faq: [
      {
        question: "Can we hire the vehicle without a driver?",
        answer: "We currently only offer chauffeur-driven rentals to ensure safety, reliability, and hassle-free transit."
      }
    ],
    type: "vehicle"
  },
  {
    id: "vehicle-hatchback",
    name: "Hatchback Rental",
    shortDescription: "Compact, fuel-efficient hatchbacks for quick city rides.",
    description: "Rent compact hatchbacks (like Swift, i10, Alto) for navigating city traffic easily at pocket-friendly rates.",
    assuranceFee: 149,
    iconName: "Car",
    benefits: [
      "Easy city parking & navigation",
      "Highly economical rates",
      "Perfect for daily running",
      "Prompt matching & dispatch"
    ],
    subServices: [
      "Intra-City Quick Rides",
      "Daily Personal Commute",
      "Short-Distance Local Running",
      "Budget Outstation Trips"
    ],
    faq: [
      {
        question: "How quickly can a hatchback be dispatched?",
        answer: "Usually within 60-90 minutes of the booking confirmation, depending on driver availability in your area."
      }
    ],
    type: "vehicle"
  },
  {
    id: "vehicle-pickup",
    name: "Pickup Rental",
    shortDescription: "Open-bed pickup trucks for medium goods and shifting.",
    description: "Rent open-bed loading pickups (like Bolero Pickup, Tata Yodha) for transporting construction materials, commercial goods, or shifting household items.",
    assuranceFee: 249,
    iconName: "Truck",
    benefits: [
      "Heavy-duty payload capacity",
      "Secure tie-down points",
      "Experienced cargo drivers",
      "Fast loading assistance"
    ],
    subServices: [
      "Building Material Transport",
      "Household Goods Shifting",
      "Commercial Load Delivery",
      "Local Factory/Warehouse Trips"
    ],
    faq: [
      {
        question: "Is loading/unloading labor included?",
        answer: "Driver helper can assist in placement, but heavy loading/unloading labor must be hired separately (available in our Helper category!)."
      }
    ],
    type: "vehicle"
  },
  {
    id: "vehicle-mini-truck",
    name: "Mini Truck Rental",
    shortDescription: "Compact mini trucks for commercial cargo and heavy transport.",
    description: "Rent mini trucks (like Tata Ace, Mahindra Jeeto) for intra-city goods transportation, retail deliveries, and small business logistics.",
    assuranceFee: 249,
    iconName: "Truck",
    benefits: [
      "Ideal for narrow city streets",
      "Cost-effective cargo transit",
      "Reliable cargo tracking",
      "Flexible booking per trip/day"
    ],
    subServices: [
      "Intra-City Cargo Delivery",
      "Shop Stock Replenishment",
      "Small Household Shifting",
      "E-commerce Delivery Support"
    ],
    faq: [
      {
        question: "Are toll taxes included in the booking fee?",
        answer: "State/highway tolls are to be paid by the customer during the trip or added to the final invoice."
      }
    ],
    type: "vehicle"
  }
];
