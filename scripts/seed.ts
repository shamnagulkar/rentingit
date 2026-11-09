// RENTINGIT seed script - run with: bun run scripts/seed.ts
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const db = new PrismaClient();

// Image URLs - using Unsplash for realistic product photos
const IMG = {
  camera: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80",
  camera2: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&q=80",
  drone: "https://images.unsplash.com/photo-1473968512647-3e447564a8ef?w=800&q=80",
  drill: "https://images.unsplash.com/photo-1504148455-e3d3946dd83a?w=800&q=80",
  tools: "https://images.unsplash.com/photo-1572981779307-09b8d0a3eb76?w=800&q=80",
  tripod: "https://images.unsplash.com/photo-1507459378473-c43371a295aa?w=800&q=80",
  ringlight: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80",
  mic: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80",
  playstation: "https://images.unsplash.com/photo-1606140562935-376d1f47c1e8?w=800&q=80",
  xbox: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&q=80",
  tent: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f5?w=800&q=80",
  camping: "https://images.unsplash.com/photo-1487730116645-74489c95b41b?w=800&q=80",
  cycle: "https://images.unsplash.com/photo-1532298199142-7c1e3b4f4f0a?w=800&q=80",
  cycle2: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80",
  saree: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80",
  suit: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
  projector: "https://images.unsplash.com/photo-1626379953822-baec19c3accd?w=800&q=80",
  speaker: "https://images.unsplash.com/photo-1608043152269-f4da244f1cfa?w=800&q=80",
  speaker2: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80",
  books: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80",
  guitar: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80",
  keyboard: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
  bp: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800&q=80",
  crutches: "https://images.unsplash.com/photo-1583912267550-d6c2ac3196ce?w=800&q=80",
  icecream: "https://images.unsplash.com/photo-1559172802-f5de4d03802c?w=800&q=80",
  baking: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
  chair: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80",
  ladder: "https://images.unsplash.com/photo-1581094288338-2314dd2077a9?w=800&q=80",
};

const CATEGORIES = [
  "Electronics",
  "Camera & Media",
  "Gaming",
  "Tools & Hardware",
  "Outdoor & Camping",
  "Fashion",
  "Music",
  "Books & Stationery",
  "Health & Medical",
  "Appliances",
  "Sports & Fitness",
  "Events & Party",
];

type SeedUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "USER" | "ADMIN";
  kycStatus: "VERIFIED" | "PENDING";
  city: string;
  trustScore: number;
  totalRatings: number;
  walletBalance: number;
};

const USERS: SeedUser[] = [
  {
    id: "user_admin_1",
    name: "Ananya Desai",
    email: "admin@rentingit.in",
    phone: "+91 98100 11111",
    password: "admin123",
    role: "ADMIN",
    kycStatus: "VERIFIED",
    city: "Mumbai",
    trustScore: 5.0,
    totalRatings: 0,
    walletBalance: 0,
  },
  {
    id: "user_rohan",
    name: "Rohan Mehta",
    email: "rohan@gmail.com",
    phone: "+91 98200 23456",
    password: "demo123",
    role: "USER",
    kycStatus: "VERIFIED",
    city: "Bengaluru",
    trustScore: 4.8,
    totalRatings: 23,
    walletBalance: 4250,
  },
  {
    id: "user_priya",
    name: "Priya Sharma",
    email: "priya@gmail.com",
    phone: "+91 98300 34567",
    password: "demo123",
    role: "USER",
    kycStatus: "VERIFIED",
    city: "Bengaluru",
    trustScore: 4.9,
    totalRatings: 41,
    walletBalance: 8900,
  },
  {
    id: "user_arjun",
    name: "Arjun Nair",
    email: "arjun@gmail.com",
    phone: "+91 98400 45678",
    password: "demo123",
    role: "USER",
    kycStatus: "VERIFIED",
    city: "Bengaluru",
    trustScore: 4.6,
    totalRatings: 15,
    walletBalance: 2100,
  },
  {
    id: "user_sneha",
    name: "Sneha Reddy",
    email: "sneha@gmail.com",
    phone: "+91 98500 56789",
    password: "demo123",
    role: "USER",
    kycStatus: "SUBMITTED",
    city: "Hyderabad",
    trustScore: 4.3,
    totalRatings: 8,
    walletBalance: 750,
  },
  {
    id: "user_vikram",
    name: "Vikram Singh",
    email: "vikram@gmail.com",
    phone: "+91 98600 67890",
    password: "demo123",
    role: "USER",
    kycStatus: "VERIFIED",
    city: "Delhi",
    trustScore: 4.7,
    totalRatings: 19,
    walletBalance: 5600,
  },
];

type SeedItem = {
  title: string;
  category: string;
  description: string;
  images: string[];
  dailyRent: number;
  securityDeposit: number;
  city: string;
  area: string;
  condition: string;
  ownerId: string;
  isAvailable: boolean;
};

const ITEMS: SeedItem[] = [
  // Priya - camera/media owner
  {
    title: "Canon EOS R6 Mark II Mirrorless Camera",
    category: "Camera & Media",
    description:
      "Professional mirrorless camera with 24-105mm lens kit. Used for 5 days last year — mint condition. Comes with 2 batteries, 128GB SD card, and a carry bag. Perfect for weddings, travel, and YouTube shoots.",
    images: [IMG.camera, IMG.camera2, IMG.tripod],
    dailyRent: 1500,
    securityDeposit: 15000,
    city: "Bengaluru",
    area: "Koramangala",
    condition: "Good",
    ownerId: "user_priya",
    isAvailable: true,
  },
  {
    title: "DJI Mavic 3 Drone with Fly More Combo",
    category: "Camera & Media",
    description:
      "Cinematic 5.1K drone with 3 batteries, ND filter set, and hard case. Flew maybe 6 hours total. Ideal for real estate shoots, wedding films, and travel vlogs.",
    images: [IMG.drone],
    dailyRent: 2500,
    securityDeposit: 25000,
    city: "Bengaluru",
    area: "Indiranagar",
    condition: "Good",
    ownerId: "user_priya",
    isAvailable: true,
  },
  {
    title: "Studio Light Kit — Ring Light + Softbox + Tripod",
    category: "Camera & Media",
    description:
      "Complete content creation lighting setup: 18-inch ring light, 2 softbox lights, 3 light stands, and backdrops (white, black, green for chroma key). Perfect for reels, product shoots, and YouTube.",
    images: [IMG.ringlight],
    dailyRent: 400,
    securityDeposit: 4000,
    city: "Bengaluru",
    area: "Koramangala",
    condition: "Good",
    ownerId: "user_priya",
    isAvailable: true,
  },
  {
    title: "Rode Wireless GO II — Dual Mic Set",
    category: "Camera & Media",
    description:
      "Wireless lapel mics for crystal-clear audio on shoots. Plug-and-play with cameras and phones. Used during one documentary project.",
    images: [IMG.mic],
    dailyRent: 350,
    securityDeposit: 4000,
    city: "Bengaluru",
    area: "Koramangala",
    condition: "Good",
    ownerId: "user_priya",
    isAvailable: false,
  },
  // Rohan - gaming + electronics owner
  {
    title: "PlayStation 5 Slim + 2 Controllers + 5 Games",
    category: "Gaming",
    description:
      "PS5 Slim 1TB, 2 DualSense controllers, charging dock, and games: God of War Ragnarok, Spider-Man 2, FC24, GTA V, Elden Ring. Finished all campaigns — your turn now.",
    images: [IMG.playstation],
    dailyRent: 800,
    securityDeposit: 8000,
    city: "Bengaluru",
    area: "HSR Layout",
    condition: "Good",
    ownerId: "user_rohan",
    isAvailable: true,
  },
  {
    title: "Xbox Series X + Game Pass Ultimate 1 month",
    category: "Gaming",
    description:
      "Xbox Series X 1TB with one controller and 1 month of Game Pass Ultimate included. Played Forza and Halo — barely used since.",
    images: [IMG.xbox],
    dailyRent: 700,
    securityDeposit: 7000,
    city: "Bengaluru",
    area: "HSR Layout",
    condition: "Good",
    ownerId: "user_rohan",
    isAvailable: true,
  },
  {
    title: "Epson Home Cinema Projector 1080p",
    category: "Electronics",
    description:
      "Full HD projector, 3000 lumens, with HDMI and screen mirroring. Used for one IPL finals party. Comes with a 100-inch pull-down screen.",
    images: [IMG.projector],
    dailyRent: 600,
    securityDeposit: 6000,
    city: "Bengaluru",
    area: "HSR Layout",
    condition: "Good",
    ownerId: "user_rohan",
    isAvailable: true,
  },
  {
    title: "JBL PartyBox 1000 — Bluetooth Party Speaker",
    category: "Electronics",
    description:
      "1100W thundering party speaker with light show. Perfect for house parties, birthdays, and terrace gigs. Comes with wireless mic for karaoke.",
    images: [IMG.speaker, IMG.speaker2],
    dailyRent: 900,
    securityDeposit: 9000,
    city: "Bengaluru",
    area: "HSR Layout",
    condition: "Good",
    ownerId: "user_rohan",
    isAvailable: true,
  },
  // Arjun - tools + outdoor owner
  {
    title: "Bosch Professional Drill Kit — GSB 13 RE",
    category: "Tools & Hardware",
    description:
      "600W hammer drill with 60-piece accessory kit (bits, screwdrivers, sockets, hole saws). Used twice for curtain installation. Includes sturdy carry case.",
    images: [IMG.drill, IMG.tools],
    dailyRent: 150,
    securityDeposit: 1500,
    city: "Bengaluru",
    area: "Whitefield",
    condition: "Good",
    ownerId: "user_arjun",
    isAvailable: true,
  },
  {
    title: "Folding Ladder 6-step Aluminium (11 ft)",
    category: "Tools & Hardware",
    description:
      "Lightweight aluminium step ladder, foldable, anti-slip steps, max load 150kg. Used once to clean ceiling fan. Perfect for Diwali cleaning or painting.",
    images: [IMG.ladder],
    dailyRent: 80,
    securityDeposit: 800,
    city: "Bengaluru",
    area: "Whitefield",
    condition: "Good",
    ownerId: "user_arjun",
    isAvailable: true,
  },
  {
    title: "4-Person Camping Tent + Sleeping Bags Combo",
    category: "Outdoor & Camping",
    description:
      "Waterproof 4-person dome tent, 2 sleeping bags, 2 ground mats, and a camp stove. Used on one Coorg trip. Great for weekend getaways.",
    images: [IMG.tent, IMG.camping],
    dailyRent: 500,
    securityDeposit: 5000,
    city: "Bengaluru",
    area: "Whitefield",
    condition: "Good",
    ownerId: "user_arjun",
    isAvailable: true,
  },
  {
    title: "Firefox Mountain Bike 26-inch — 21 Speed",
    category: "Sports & Fitness",
    description:
      "Aluminium-frame MTB with disc brakes and 21-speed Shimano gears. Used in college, idle since. Serviced recently. Helmet included.",
    images: [IMG.cycle, IMG.cycle2],
    dailyRent: 250,
    securityDeposit: 3000,
    city: "Bengaluru",
    area: "Whitefield",
    condition: "Fair",
    ownerId: "user_arjun",
    isAvailable: true,
  },
  // Vikram - fashion + events owner
  {
    title: "Designer Silk Saree — Kanjivaram (Wedding Wear)",
    category: "Fashion",
    description:
      "Pure silk Kanjivaram saree with gold zari border, comes with matching blouse piece. Worn twice for weddings. Dry-cleaned and stored. Perfect for the bride or groom's sister.",
    images: [IMG.saree],
    dailyRent: 1200,
    securityDeposit: 12000,
    city: "Delhi",
    area: "Lajpat Nagar",
    condition: "Good",
    ownerId: "user_vikram",
    isAvailable: true,
  },
  {
    title: "Premium Three-Piece Suit — Raymond (Wedding Sherwani Too)",
    category: "Fashion",
    description:
      "Charcoal grey Raymond suit (size 40) + ivory sherwani with churidar. Worn once for my brother's wedding. Includes tie, pocket square, and brooch.",
    images: [IMG.suit],
    dailyRent: 1000,
    securityDeposit: 10000,
    city: "Delhi",
    area: "Lajpat Nagar",
    condition: "Good",
    ownerId: "user_vikram",
    isAvailable: true,
  },
  {
    title: "Acoustic Guitar — Yamaha F310 with Strap & Capo",
    category: "Music",
    description:
      "Beginner-friendly Yamaha F310 acoustic guitar with carry bag, strap, capo, and extra strings. Used during one college fest season.",
    images: [IMG.guitar],
    dailyRent: 200,
    securityDeposit: 2500,
    city: "Delhi",
    area: "Lajpat Nagar",
    condition: "Good",
    ownerId: "user_vikram",
    isAvailable: true,
  },
  // Sneha - appliances + books owner
  {
    title: "KitchenAid Baking Kit — Stand Mixer + Cake Tins",
    category: "Appliances",
    description:
      "KitchenAid Artisan 4.8L stand mixer (red) with whisk, dough hook, and paddle attachments. Plus 3 cake tins and piping set. Used during one Christmas bake-a-thon.",
    images: [IMG.baking],
    dailyRent: 500,
    securityDeposit: 6000,
    city: "Hyderabad",
    area: "Gachibowli",
    condition: "Good",
    ownerId: "user_sneha",
    isAvailable: true,
  },
  {
    title: "Cuisinart Ice Cream Maker — 2L Compressor",
    category: "Appliances",
    description:
      "Self-freezing ice cream maker, makes 2L in 60 minutes. Used twice for kids' birthday parties. Comes with recipe book.",
    images: [IMG.icecream],
    dailyRent: 350,
    securityDeposit: 4000,
    city: "Hyderabad",
    area: "Gachibowli",
    condition: "Good",
    ownerId: "user_sneha",
    isAvailable: true,
  },
  {
    title: "JEE/NEET Book Bundle — 30 Books + Mock Test Pack",
    category: "Books & Stationery",
    description:
      "Complete JEE + NEET prep bundle: HC Verma, Irodov, MS Chouhan, 12 years PYQ, Allen modules, and 10 mock test papers. My sister used these for her prep — barely written in.",
    images: [IMG.books],
    dailyRent: 100,
    securityDeposit: 1500,
    city: "Hyderabad",
    area: "Gachibowli",
    condition: "Good",
    ownerId: "user_sneha",
    isAvailable: true,
  },
  {
    title: "Digital BP Monitor + Crutches (Medical Combo)",
    category: "Health & Medical",
    description:
      "Omron automatic BP monitor (with 4 AA batteries) + pair of adjustable aluminium crutches. Both used briefly during recovery. BP monitor is calibrated and accurate.",
    images: [IMG.bp, IMG.crutches],
    dailyRent: 120,
    securityDeposit: 1500,
    city: "Hyderabad",
    area: "Gachibowli",
    condition: "Good",
    ownerId: "user_sneha",
    isAvailable: true,
  },
];

async function main() {
  console.log("🗑️  Cleaning existing data...");
  await db.chatMessage.deleteMany();
  await db.conversation.deleteMany();
  await db.dispute.deleteMany();
  await db.review.deleteMany();
  await db.walletTransaction.deleteMany();
  await db.payment.deleteMany();
  await db.booking.deleteMany();
  await db.kycDocument.deleteMany();
  await db.item.deleteMany();
  await db.user.deleteMany();

  console.log("👤 Creating users...");
  for (const u of USERS) {
    await db.user.create({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        passwordHash: await hashPassword(u.password),
        role: u.role,
        kycStatus: u.kycStatus,
        kycDocType: u.kycStatus === "VERIFIED" ? "AADHAAR" : null,
        kycDocNumber: u.kycStatus === "VERIFIED" ? "XXXX-XXXX-" + u.id.slice(-4) : null,
        trustScore: u.trustScore,
        totalRatings: u.totalRatings,
        walletBalance: u.walletBalance,
        city: u.city,
      },
    });
  }

  console.log("📦 Creating items...");
  const createdItems = [];
  for (const it of ITEMS) {
    const item = await db.item.create({
      data: {
        title: it.title,
        category: it.category,
        description: it.description,
        images: JSON.stringify(it.images),
        dailyRent: it.dailyRent,
        securityDeposit: it.securityDeposit,
        city: it.city,
        area: it.area,
        condition: it.condition,
        ownerId: it.ownerId,
        isAvailable: it.isAvailable,
      },
    });
    createdItems.push(item);
  }

  // Create a couple of completed bookings with reviews for trust-score realism
  console.log("📝 Creating sample bookings + reviews...");

  const ps5 = createdItems.find((i) => i.title.includes("PlayStation 5"))!;
  const camera = createdItems.find((i) => i.title.includes("Canon EOS R6"))!;
  const drill = createdItems.find((i) => i.title.includes("Bosch"))!;

  // Completed booking 1: Arjun rented PS5 from Rohan, both reviewed
  const startDate1 = new Date("2026-10-10");
  const endDate1 = new Date("2026-10-13");
  const days1 = 4;
  const totalRent1 = ps5.dailyRent * days1;
  const platFee1 = totalRent1 * 0.1;
  const grand1 = totalRent1 + ps5.securityDeposit + platFee1;
  const b1 = await db.booking.create({
    data: {
      itemId: ps5.id,
      renterId: "user_arjun",
      startDate: startDate1,
      endDate: endDate1,
      totalRent: totalRent1,
      securityDeposit: ps5.securityDeposit,
      platformFee: platFee1,
      grandTotal: grand1,
      status: "COMPLETED",
      ownerApprovedAt: new Date("2026-10-09"),
      paidAt: new Date("2026-10-09"),
      pickedUpAt: new Date("2026-10-10"),
      returnedAt: new Date("2026-10-13"),
      completedAt: new Date("2026-10-14"),
    },
  });
  await db.payment.create({
    data: {
      bookingId: b1.id,
      userId: "user_arjun",
      amount: grand1,
      type: "RENT",
      method: "UPI",
      razorpayId: "pay_demo_" + b1.id.slice(0, 8),
      status: "SUCCESS",
    },
  });
  // Deposit refund
  await db.payment.create({
    data: {
      bookingId: b1.id,
      userId: "user_arjun",
      amount: ps5.securityDeposit,
      type: "REFUND",
      method: "UPI",
      status: "SUCCESS",
    },
  });
  // Owner payout (rent - platform fee)
  await db.walletTransaction.create({
    data: {
      userId: "user_rohan",
      type: "CREDIT",
      amount: totalRent1 - platFee1,
      reference: b1.id,
      description: `Payout for booking — ${ps5.title}`,
      balanceAfter: 4250 + (totalRent1 - platFee1),
    },
  });
  // Reviews both ways
  await db.review.create({
    data: {
      bookingId: b1.id,
      reviewerId: "user_arjun",
      revieweeId: "user_rohan",
      rating: 5,
      comment: "Smooth handover, console was spotless and Rohan was super flexible on pickup time. Will rent again!",
      type: "RENTER_TO_OWNER",
    },
  });
  await db.review.create({
    data: {
      bookingId: b1.id,
      reviewerId: "user_rohan",
      revieweeId: "user_arjun",
      rating: 5,
      comment: "Returned on time, packed everything back neatly. Top-tier renter.",
      type: "OWNER_TO_RENTER",
    },
  });

  // Completed booking 2: Sneha rented camera from Priya
  const days2 = 3;
  const totalRent2 = camera.dailyRent * days2;
  const platFee2 = totalRent2 * 0.1;
  const grand2 = totalRent2 + camera.securityDeposit + platFee2;
  const b2 = await db.booking.create({
    data: {
      itemId: camera.id,
      renterId: "user_sneha",
      startDate: new Date("2026-10-22"),
      endDate: new Date("2026-10-24"),
      totalRent: totalRent2,
      securityDeposit: camera.securityDeposit,
      platformFee: platFee2,
      grandTotal: grand2,
      status: "COMPLETED",
      ownerApprovedAt: new Date("2026-10-21"),
      paidAt: new Date("2026-10-21"),
      pickedUpAt: new Date("2026-10-22"),
      returnedAt: new Date("2026-10-24"),
      completedAt: new Date("2026-10-25"),
    },
  });
  await db.payment.create({
    data: {
      bookingId: b2.id,
      userId: "user_sneha",
      amount: grand2,
      type: "RENT",
      method: "UPI",
      razorpayId: "pay_demo_" + b2.id.slice(0, 8),
      status: "SUCCESS",
    },
  });
  await db.payment.create({
    data: {
      bookingId: b2.id,
      userId: "user_sneha",
      amount: camera.securityDeposit,
      type: "REFUND",
      method: "UPI",
      status: "SUCCESS",
    },
  });
  await db.walletTransaction.create({
    data: {
      userId: "user_priya",
      type: "CREDIT",
      amount: totalRent2 - platFee2,
      reference: b2.id,
      description: `Payout for booking — ${camera.title}`,
      balanceAfter: 8900 + (totalRent2 - platFee2),
    },
  });
  await db.review.create({
    data: {
      bookingId: b2.id,
      reviewerId: "user_sneha",
      revieweeId: "user_priya",
      rating: 5,
      comment: "Camera was pristine, lens spotless. Priya walked me through the settings. 10/10.",
      type: "RENTER_TO_OWNER",
    },
  });
  await db.review.create({
    data: {
      bookingId: b2.id,
      reviewerId: "user_priya",
      revieweeId: "user_sneha",
      rating: 4,
      comment: "Returned on time, slight dust on lens but cleaned off easily. Would rent again.",
      type: "OWNER_TO_RENTER",
    },
  });

  // Active booking 3: Vikram booked drill from Arjun (PAID, awaiting pickup)
  const days3 = 2;
  const totalRent3 = drill.dailyRent * days3;
  const platFee3 = totalRent3 * 0.1;
  const grand3 = totalRent3 + drill.securityDeposit + platFee3;
  const b3 = await db.booking.create({
    data: {
      itemId: drill.id,
      renterId: "user_vikram",
      startDate: new Date("2026-11-09"),
      endDate: new Date("2026-11-10"),
      totalRent: totalRent3,
      securityDeposit: drill.securityDeposit,
      platformFee: platFee3,
      grandTotal: grand3,
      status: "PAID",
      ownerApprovedAt: new Date("2026-11-08"),
      paidAt: new Date("2026-11-08"),
    },
  });
  await db.payment.create({
    data: {
      bookingId: b3.id,
      userId: "user_vikram",
      amount: grand3,
      type: "RENT",
      method: "UPI",
      razorpayId: "pay_demo_" + b3.id.slice(0, 8),
      status: "SUCCESS",
    },
  });

  // KYC submissions — 2 verified users have approved KYC docs, 1 user has pending
  console.log("🪪  Creating KYC submissions...");
  const kycImg1 = "https://images.unsplash.com/photo-1622434641406-a158e7467558?w=800&q=80";
  const selfieImg1 = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80";

  // Already-verified KYC docs (for Rohan and Priya)
  for (const u of ["user_rohan", "user_priya"]) {
    const u2 = await db.user.findUnique({ where: { id: u } });
    if (u2) {
      await db.kycDocument.create({
        data: {
          userId: u,
          docType: u2.kycDocType || "AADHAAR",
          docNumber: u2.kycDocNumber || "XXXX-XXXX-1234",
          docImageUrl: kycImg1,
          selfieImageUrl: selfieImg1,
          status: "APPROVED",
          reviewedBy: "user_admin_1",
          reviewedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // Change Sneha's status to SUBMITTED and create pending KYC for admin to review
  await db.user.update({
    where: { id: "user_sneha" },
    data: { kycStatus: "SUBMITTED", kycDocType: "AADHAAR", kycDocNumber: "8765-XXXX-43" },
  });
  await db.kycDocument.create({
    data: {
      userId: "user_sneha",
      docType: "AADHAAR",
      docNumber: "8765 4321 9043",
      docImageUrl: kycImg1,
      selfieImageUrl: selfieImg1,
      status: "PENDING",
    },
  });

  // Add a 7th demo user with pending KYC for the admin queue
  const newUser = await db.user.create({
    data: {
      id: "user_kabir",
      name: "Kabir Khan",
      email: "kabir@gmail.com",
      phone: "+91 98700 99999",
      passwordHash: await hashPassword("demo123"),
      role: "USER",
      kycStatus: "SUBMITTED",
      kycDocType: "PAN",
      kycDocNumber: "ABCPK****K",
      trustScore: 5.0,
      totalRatings: 0,
      walletBalance: 0,
      city: "Mumbai",
    },
  });
  await db.kycDocument.create({
    data: {
      userId: "user_kabir",
      docType: "PAN",
      docNumber: "ABCPK1234K",
      docImageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff9c6c?w=800&q=80",
      selfieImageUrl: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=800&q=80",
      status: "PENDING",
    },
  });

  // Add a chat conversation + messages for booking b1 (Arjun rented PS5 from Rohan)
  console.log("💬 Creating chat conversation...");
  const conv = await db.conversation.create({
    data: {
      bookingId: b1.id,
      ownerId: "user_rohan",
      renterId: "user_arjun",
      itemId: ps5.id,
    },
  });
  const chatMessages = [
    { senderId: "user_arjun", message: "Hi Rohan! Excited to pick up the PS5. Is Sunday 11am ok?", offset: -3 * 24 * 60 * 60 * 1000 },
    { senderId: "user_rohan", message: "Hey Arjun! Sunday 11am works perfectly. I'm in HSR Sector 2, I'll share the exact pin on WhatsApp.", offset: -3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000 },
    { senderId: "user_arjun", message: "Awesome. Do the DualSense controllers have working haptics? Just curious 😄", offset: -3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000 },
    { senderId: "user_rohan", message: "Both work perfectly — I barely used them. You'll get 2 controllers, charging dock, and 5 game discs.", offset: -3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000 },
    { senderId: "user_arjun", message: "Perfect. See you Sunday! 🎮", offset: -3 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000 },
  ];
  for (const m of chatMessages) {
    await db.chatMessage.create({
      data: {
        conversationId: conv.id,
        senderId: m.senderId,
        message: m.message,
        createdAt: new Date(Date.now() + m.offset),
      },
    });
  }

  console.log("✅ Seed complete!");
  console.log(`   7 users, ${ITEMS.length} items, 3 bookings, 4 reviews, 3 KYC docs, 5 chat messages`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
