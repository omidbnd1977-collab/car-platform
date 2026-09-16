// ------------------------------------------------------------
// کاتالوگ جهانی برندها و مدل‌ها (آف‌لاین، داخل خود فرانت)
// ------------------------------------------------------------
// دیتابیس فقط برندهایی را دارد که یک‌بار در آن ثبت شده‌اند (روی هاست ۱۰ برند
// است)، برای همین کمبوکس برند ناقص بود و کمبوکس مدل برای برندهای تازه خالی
// می‌ماند. این فایل برندهای بازار دبی/امارات و دنیا را می‌دهد و با داده‌ی سرور
// ادغام می‌شود:
//   • برند همیشه از لیست انتخاب می‌شود → خطای تایپ حذف می‌شود
//   • مدل هم از همین لیست می‌آید → کمبوکس مدل هیچ‌وقت بی‌گزینه نمی‌ماند
//   • برندی که در دیتابیس نیست، با ذخیره‌ی خودرو find-or-create می‌شود
//     (backend/src/services/catalogService.js → resolveBrandAndModel)
//
// ترتیب کلیدها = ترتیب نمایش در کمبوکس؛ پرفروش‌های امارات اول.
// این فایل با /tmp/gen_catalog.py تولید شده (داده + راستی‌آزمایی یکتایی).
// ------------------------------------------------------------

const DATA = {
    "Toyota": ["Land Cruiser", "Land Cruiser Prado", "Land Cruiser 70", "LC300", "Hilux", "Hilux Single Cab", "Hilux Double Cab", "Hilux SR", "Hilux SR5", "Hilux GR Sport", "Hilux Revo", "Hilux Rogue", "Hilux Champ", "Hilux Invincible", "Fortuner", "4Runner", "Rush", "Camry", "Corolla", "Corolla Cross", "RAV4", "Highlander", "Sequoia", "Tundra", "Tacoma", "Yaris", "Yaris Cross", "C-HR", "Avensis", "Avalon", "Sienna", "Prius", "Coaster", "Hiace", "Granvia", "Alphard", "Vellfire", "Tarago", "Previa", "Noah", "Voxy", "Harrier", "Crown", "Mark X", "FJ Cruiser", "Proace City", "Aygo", "Urban Cruiser", "bZ4X", "Innova", "Innova Crysta", "Avanza", "Veloz", "Raize", "Raum", "bB", "Passo", "Vitz", "Belta", "Etios", "Glaza"],
    "Nissan": ["Patrol", "Patrol Nismo", "Armada", "Sentry", "Sunny", "Sentra", "Titan", "Navara", "Frontier", "X-Trail", "Rogue", "Altima", "Maxima", "Versa", "Kicks", "Juke", "Qashqai", "Micra", "Note", "Serena", "Elgrand", "Urvan", "Caravan", "Murano", "Pathfinder", "Terra", "Xterra", "Leaf", "Ariya", "GT-R", "370Z", "Z", "Pulsar", "Sylphy"],
    "Hyundai": ["Sonata", "Elantra", "Verna", "Accent", "i10", "i20", "i30", "Tucson", "Santa Fe", "Palisade", "Creta", "Venue", "Alcazar", "Bayon", "Kona", "Kona Electric", "Ioniq 5", "Ioniq 6", "Staria", "H1", "Grand Starex", "Porter", "Tucson Hybrid", "Santa Cruz", "Exter", "Casper", "Azera", "Terracan", "Galloper"],
    "Kia": ["Cerato", "Forte", "K4", "K5", "K8", "K9", "Rio", "Pegas", "Picanto", "Morning", "Sportage", "Sorento", "Telluride", "Borrego", "Seltos", "Sonet", "Carnival", "Sedona", "Carens", "Stinger", "Niro", "EV5", "EV6", "EV9", "Soul", "Mohave", "Bongo", "Tasman", "Sportage Hybrid", "Carnival Hybrid"],
    "Lexus": ["LX570", "LX600", "ES", "IS", "GS", "LS", "RC", "LC", "RX300", "RX350", "RX450h", "NX200", "NX300", "NX350h", "UX", "GX460", "GX550", "LM", "RZ", "CT200h", "HS", "SC", "F Sport"],
    "Mercedes": ["C180", "C200", "C300", "C43 AMG", "C63 AMG", "E200", "E250", "E300", "E450", "E63 AMG", "S500", "S580", "Maybach S580", "Maybach GLS600", "CLS", "CLE", "CLA", "A180", "A200", "AMG A45", "GLA", "GLB", "GLC", "GLC Coupe", "GLE", "GLE Coupe", "GLS", "G63 AMG", "G500", "AMG GT", "Vito", "V-Class", "Sprinter", "Citan", "T-Class", "EQA", "EQB", "EQE", "EQS", "C300e", "ML350", "R-Class"],
    "BMW": ["320i", "328i", "330i", "M340i", "M3", "520i", "525i", "528i", "530i", "540i", "M5", "740i", "750i", "i7", "118i", "218i", "420i", "430i", "640i GT", "840i", "X1", "X2", "X3", "X3 M", "X4", "X4 M", "X5", "X5 M", "X6", "X6 M", "X7", "XM", "Z4", "i4", "i5", "iX", "iX1", "iX3", "M2", "M4", "i8"],
    "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "S3", "S4", "S5", "S6", "S8", "RS6", "RS7", "Q3", "Q3 Sportback", "Q5", "Q7", "Q8", "SQ5", "SQ7", "SQ8", "RS Q8", "e-tron", "Q4 e-tron", "Q8 e-tron", "A6 e-tron", "R8", "TT", "Allroad"],
    "Range Rover": ["Range Rover", "Range Rover Sport", "Range Rover Velar", "Range Rover Evoque", "Autobiography", "SVR", "Sentinel", "Discovery", "Discovery Sport", "Freelander", "Defender 110", "Defender 90"],
    "Land Rover": ["Defender 90", "Defender 110", "Discovery", "Discovery Sport", "Freelander", "LR3", "LR4", "Series III", "Range Rover Classic"],
    "Ford": ["Mustang", "Mustang Mach-E", "F-150", "Ranger", "Everest", "Explorer", "Expedition", "Escape", "Kuga", "EcoSport", "Puma", "Edge", "Bronco", "Bronco Sport", "Maverick", "Endeavour", "Focus", "Fiesta", "Mondeo", "Taurus", "Fusion", "Transit", "E-Transit", "Tourneo Custom", "GT", "Super Duty"],
    "Chevrolet": ["Tahoe", "Suburban", "Silverado", "Camaro", "Corvette", "Malibu", "Cruze", "Spark", "Aveo", "Sail", "Traverse", "Trax", "Equinox", "Blazer", "Trailblazer", "Colorado", "Caprice", "Impala", "Orlando", "Captiva", "Express", "Bolt EV", "Monza", "Onix", "Tracker"],
    "Honda": ["Civic", "Accord", "City", "CR-V", "HR-V", "WR-V", "BR-V", "Jazz", "Fit", "Amaze", "Pilot", "Passport", "Ridgeline", "Odyssey", "Stepwgn", "Freed", "N-Box", "NSX", "Prologue", "CR-Z", "Insight", "S660", "Elevate"],
    "Mazda": ["Mazda3", "Mazda3 Sedan", "Mazda6", "Mazda2", "CX-3", "CX-30", "CX-5", "CX-50", "CX-60", "CX-8", "CX-9", "BT-50", "MX-5", "RX-7", "RX-8", "EZ-6", "Flair", "Bongo", "Demio", "Scrum"],
    "Mitsubishi": ["L200", "Triton", "Pajero", "Pajero Sport", "Montero", "Outlander", "Outlander PHEV", "ASX", "Eclipse Cross", "Xpander", "Xpander Cross", "Attrage", "Mirage", "Lancer", "Lancer Evolution", "Galant", "Delica D:5", "Eclipse", "i-MiEV", "Colt"],
    "Suzuki": ["Swift", "Dzire", "Ciaz", "Alto", "Jimny", "Grand Vitara", "Vitara Brezza", "Baleno", "Ertiga", "Fronx", "S-Presso", "Ignis", "Celerio", "XL6", "Carry", "Every", "APV", "Kizashi", "SX4", "Deres", "Cultius"],
    "Subaru": ["Crosstrek", "Forester", "Outback", "Legacy", "Impreza", "WRX", "WRX STI", "BRZ", "Solterra", "Levorg", "Justy", "SVX", "Stella", "Pleo", "Dex"],
    "Isuzu": ["D-Max", "D-Max V-Cross", "MU-X", "F-Series", "N-Series", "ELF", "Giga", "H-Series", "Trooper", "Wizard", "Bighorn", "Axis", "MTR5"],
    "Volkswagen": ["Golf", "Golf GTI", "Golf R", "Jetta", "Sagitar", "Polo", "Vento", "Passat", "Tiguan", "Tiguan L", "Teramont", "Atlas", "Taos", "T-Cross", "T-Roc", "Touareg", "ID.3", "ID.4", "ID.5", "ID.6", "ID. Buzz", "Beetle", "up!", "Caddy", "Transporter", "Caravelle", "Amarok", "Scirocco", "Saveiro", "Nivus"],
    "Porsche": ["Cayenne", "Cayenne Coupe", "Cayenne Turbo E-Hybrid", "Panamera", "911 Carrera", "911 Turbo S", "911 GT3", "911 Dakar", "Macan", "Macan Electric", "Taycan", "Taycan Cross Turismo", "718 Boxster", "718 Cayman"],
    "Ferrari": ["Roma", "Amalfi", "296 GTB", "296 GTS", "SF90 Stradale", "SF90 Spider", "Purosangue", "812 Superfast", "12Cilindri", "F8 Tributo", "488 GTB", "458 Italia", "458 Spider", "F12berlinetta", "California T", "Portofino M", "Enzo", "LaFerrari", "Monza SP2", "Daytona SP3", "Testarossa", "F40"],
    "Lamborghini": ["Urus", "Huracan Evo", "Huracan Tecnica", "Huracan Sterrato", "Revuelto", "Temerario", "Gallardo", "Aventador", "Countach", "Diablo", "Murcielago", "LM002", "Sian FKP 37", "Essenza SCV12"],
    "Rolls-Royce": ["Cullinan", "Cullinan Black Badge", "Ghost", "Phantom", "Spectre", "Wraith", "Dawn", "Silver Shadow", "Corniche"],
    "Bentley": ["Continental GT", "Continental GTC", "Flying Spur", "Bentayga", "Mulsanne", "Arnage", "Turbo R", "Azure", "Bacalar", "Mulliner Batur"],
    "Aston Martin": ["DB12", "DB11", "DB11 Volante", "Vantage", "DBS Superleggera", "Vanquish", "DBX", "Valhalla", "Valkyrie", "DB9", "V8 Vantage", "One-77"],
    "McLaren": ["720S", "750S", "750LT", "Artura", "GT", "600LT", "765LT", "Senna", "P1", "570S", "540C", "MP4-12C", "F1", "W1", "Solus GT"],
    "Bugatti": ["Chiron", "Chiron Super Sport", "Tourbillon", "Mistral", "Bolide", "Divo", "La Voiture Noire", "Veyron", "Centodieci", "EB110"],
    "Koenigsegg": ["Jesko", "Jesko Absolut", "Gemera", "Regera", "Agera RS", "One:1", "CC8S", "CCX"],
    "Pagani": ["Huayra", "Utopia", "Zonda", "Huayra BC", "Zonda R", "Imola"],
    "Lotus": ["Emira", "Eletre", "Emeya", "Evija", "Elise", "Exige", "Evora", "Esprit", "Elite", "Europa", "Excel"],
    "Alfa Romeo": ["Giulia", "Stelvio", "Tonale", "Junior", "4C", "8C Competizione", "Giulietta", "MiTo", "159", "166", "Brera", "Disco Volante"],
    "Maserati": ["Ghibli", "Quattroporte", "Levante", "Grecale", "MC20", "MC20 Cielo", "GranTurismo", "GranCabrio", "Folgore", "Biturbo", "3200 GT"],
    "Maybach": ["S580", "S680", "GLS600", "57", "62", "57S", "Zeppelin"],
    "Brabus": ["G V8", "Brabus 800", "Brabus 700", "XLP 800", "Brabus GLS", "Brabus S-Class", "Rocket 900"],
    "Mansory": ["Tusca", "Mansone", "Grande", "Venatus", "Stallone", "Landaulet", "Falcon"],
    "Lumma": ["CLR G", "T700", "G770", "CLR R", "Design GT"],
    "GMC": ["Sierra", "Sierra Denali", "Sierra EV Denali", "Yukon", "Yukon Denali", "Acadia", "Terrain", "Hummer EV", "Canyon", "Savana"],
    "RAM": ["1500", "1500 Classic", "2500", "3500", "TRX", "Rebel", "Big Horn", "Laramie", "Limited", "ProMaster", "Ramcharger"],
    "Dodge": ["Charger", "Challenger", "Durango", "Durango SRT Hellcat", "Dart", "Neon", "Journey", "Grand Caravan", "Viper", "Hornet", "Charger Daytona"],
    "Jeep": ["Wrangler", "Wrangler 4xe", "Grand Cherokee", "Grand Cherokee L", "Cherokee", "Compass", "Renegade", "Gladiator", "Grand Wagoneer", "Wagoneer", "Avenger", "Commander", "Patriot", "Liberty", "CJ"],
    "Cadillac": ["Escalade", "Escalade IQ", "CT4", "CT5", "XT4", "XT5", "XT6", "Lyriq", "Celestiq", "ATS", "CTS", "SRX", "STS", "XLR", "DeVille", "Fleetwood"],
    "Lincoln": ["Navigator", "Aviator", "Nautilus", "Corsair", "MKZ", "MKC", "MKX", "Town Car", "Continental", "LS"],
    "Chrysler": ["300", "300C", "Pacifica", "Grand Voyager", "Voyager", "Town & Country", "Sebring", "200", "Aspen", "Crossfire", "PT Cruiser", "Neon", "LHS", "LeBaron", "Concorde", "Intrepid", "New Yorker"],
    "Buick": ["Enclave", "Encore", "Envision", "Regal", "LaCrosse", "Verano", "Excelle", "Century", "Park Avenue", "Rainier"],
    "Tesla": ["Model 3", "Model 3 Highland", "Model Y", "Model Y Long Range", "Model S", "Model X", "Cybertruck"],
    "Scion": ["tC", "xB", "xD", "FR-S", "iM", "iA", "iQ"],
    "Skoda": ["Fabia", "Scala", "Rapid", "Slavia", "Octavia", "Superb", "Kushaq", "Kamiq", "Karoq", "Kodiaq", "Enyaq", "Enyaq Coupe", "Roomster", "Yeti", "Citigo", "Felicia"],
    "SEAT": ["Ibiza", "Leon", "Ateca", "Arona", "Toledo", "Alhambra", "Altea", "Mii", "Malaga", "Inca", "Tarraco"],
    "Cupra": ["Formentor", "Leon", "Ateca", "Arona", "Born", "Tavascan", "Terramar"],
    "Renault": ["Duster", "Kwid", "City K-ZE", "Clio", "Megane", "Scenic", "Captur", "Arkana", "Austral", "Rafale", "Trafic", "Master", "Kangoo", "Twingo", "5 E-Tech", "Logan", "Sandero", "Symbol", "Fluence", "Espace", "Laguna", "Talisman", "Alaskan"],
    "Peugeot": ["208", "2008", "301", "308", "3008", "408", "508", "5008", "Partner", "Expert", "Boxer", "Bipper", "Rifter", "Landtrek", "Trekker", "e-208", "e-3008", "405", "406", "605", "807", "RCZ"],
    "Citroen": ["C3", "C3 Aircross", "C3-XR", "C4", "C4 Cactus", "C4 X", "C5 Aircross", "C5 X", "Berlingo", "Jumpy", "Jumper", "Spacetourer", "C-Elysse", "E-Berlingo", "Ami", "Xsara", "ZX", "C6", "DS3", "DS4"],
    "Fiat": ["Panda", "500", "500X", "500e", "Tipo", "Doblo", "Ducato", "Scudo", "Qubo", "Freemont", "Fullback", "Punto", "Linea", "Bravo", "124 Spider", "Cronos", "Strada", "Topolino", "Palio", "Uno"],
    "Volvo": ["XC40", "XC60", "XC90", "EX30", "EX40", "EX90", "EC40", "S60", "S90", "V40", "V60", "V90", "C30", "C40", "XC70", "S40", "850", "940", "960", "V60 Cross Country"],
    "Mini": ["Cooper", "Cooper S", "Cooper SE", "One", "Clubman", "Countryman", "Paceman", "Convertible", "Hatch 3-Door", "Hatch 5-Door", "John Cooper Works", "Aceman"],
    "Ineos": ["Grenadier", "Quartermaster", "Fieldmaster", "Grenadier Station Wagon"],
    "Smart": ["#1", "#3", "#5", "Fortwo", "Forfour", "Roadster", "Crossblade"],
    "DS": ["DS 3", "DS 3 Crossback E-Tense", "DS 4", "DS 7", "DS 9", "DS N8"],
    "Dacia": ["Duster", "Sandero", "Stepway", "Jogger", "Spring", "Bigster", "Logan", "Dokker", "Lodgy"],
    "Lancia": ["Ypsilon", "Delta", "Thema", "Lybra", "Phedra", "Stratos", "Dedra", "Kappa"],
    "Alpine": ["A110", "A110 R", "A290", "A390", "Celebration"],
    "Jaguar": ["F-Pace", "E-Pace", "I-Pace", "XF", "XE", "F-Type", "XJ", "XK", "XJS", "X-Type", "S-Type", "E-Type"],
    "Infiniti": ["Q50", "Q60", "Q70", "QX50", "QX55", "QX60", "QX80", "FX35", "EX37", "G37", "M37", "JX35", "QX4", "IPL", "G35"],
    "Genesis": ["G70", "G70 Shooting Brake", "G80", "G90", "GV60", "GV70", "GV80", "GV80 Coupe", "X Convertible", "EQ900"],
    "BYD": ["Song Plus", "Song Pro", "Atto 3", "Seal", "Han", "Tang", "Dolphin", "Seagull", "Sealion 7", "Sealion 6", "M6", "E6", "F3", "Shark 6", "Leopard 8", "Destroyer 05", "Qin Plus", "Yuan Plus"],
    "Yangwang": ["U8", "U9", "U7"],
    "Denza": ["N7", "D9", "Z9 GT", "Bao 5", "N9"],
    "Fang Cheng Bao": ["Bao 5", "Bao 8"],
    "Geely": ["Emgrand", "Coolray", "Azkarra", "Tugella", "Monjaro", "Okavango", "Preface", "Cityray", "Boyue", "Haoyue", "Geometry C", "Geometry E", "X3 Pro", "Emgrand EV", "Galaxy L6"],
    "Lynk & Co": ["01", "03", "05", "06", "08", "09", "09 EM-P", "Z10", "900"],
    "Changan": ["Alsvin", "CS15", "CS35 Plus", "CS55 Plus", "CS75 Plus", "UNI-T", "UNI-K", "UNI-V", "Oshan", "Benni", "Eado", "Lumin", "Hunter", "F70", "Nevo A05", "Nevo Q05"],
    "Deepal": ["S07", "SL03", "S05", "G318", "L07"],
    "Haval": ["Jolion", "Jolion Pro", "H6", "H6 GT", "H9", "Dargo", "F7", "M6", "Poer", "Shark", "Pao"],
    "Tank": ["300", "300 Diesel", "400 Hi4-T", "500", "500 PHEV", "700", "900"],
    "Great Wall": ["Wingle 7", "Wingle 6", "Steed 5", "Poer Sahar", "Ora Good Cat", "Soul", "DeLi", "Voleex C10"],
    "Chery": ["Tiggo 4 Pro", "Tiggo 7 Pro", "Tiggo 8 Pro", "Tiggo 3", "Arrizo 6", "Arrizo 8", "Fullwin", "Cowin", "Tiggo 7 C-DM"],
    "Omoda": ["C5", "C5 EV", "O5", "J5", "J7", "C7"],
    "Jaecoo": ["J5", "J7", "J7 AWD", "J8", "TJ1"],
    "Exeed": ["TXL", "VX", "LX", "RX", "Sterra ET5"],
    "Jetour": ["Dashing", "T2", "D7", "X70 Plus", "X70 Pro", "X90 Plus", "F7", "X20", "Zongheng G700"],
    "Kaiyi": ["E5", "X3 Pro", "X5", "X6 Kunlun", "X7"],
    "iCar": ["03", "V23", "V27", "V23 Jet Tour"],
    "GAC": ["GS3 Power", "GS4 Plus", "GS8", "M8", "Empow", "Hyptec HT", "Aion LX"],
    "Aion": ["Y Plus", "V Plus", "S Plus", "UT", "Hyper GT", "Hyper SSR"],
    "Hongqi": ["H5", "H6", "H9", "HS5", "HS7", "E-HS9", "E-QM5", "Guoya", "LS7", "Z05"],
    "Wey": ["Blue Mountain", "Gaoshan", "Lanshan", "Moca", "VV7", "VV6"],
    "Leapmotor": ["C10", "C16", "C11", "T03", "B10", "C01"],
    "Voyah": ["Free", "Dream", "Passion", "Courage", "Zhuiguang"],
    "Avatr": ["11", "12", "06", "07"],
    "NIO": ["ET5", "ET5 Touring", "ET7", "ES6", "ES7", "ES8", "EC6", "EL7", "EL8", "EP9", "Firefly"],
    "XPeng": ["G6", "G7", "G9", "P7", "P7i", "X9", "P5", "MONA M03", "G3i"],
    "Li Auto": ["L6", "L7", "L8", "L9", "MEGA"],
    "Zeekr": ["001", "001 FR", "009", "009 Grand", "7X", "X", "MIX"],
    "Polestar": ["Polestar 1", "Polestar 2", "Polestar 3", "Polestar 4", "Polestar 5"],
    "Lucid": ["Air Pure", "Air Touring", "Air Grand Touring", "Air Sapphire", "Gravity"],
    "Rivian": ["R1T", "R1S", "R2", "R3", "ED-9"],
    "Arcfox": ["Alpha T5", "Alpha S5", "Kaola", "Alpha X", "N60"],
    "Riddara": ["RD6", "RD6 PHEV", "EM-P"],
    "Maxus": ["T60", "T90 EV", "D90 Pro", "Mifa 9", "MIFA 7", "eDeliver 3", "V80", "G20"],
    "LDV": ["T60", "G10", "G20", "D90", "eDeliver 3", "V80"],
    "BAIC": ["X55", "X7", "X35", "BJ30", "BJ40", "BJ60", "Beijing 3", "Beijing 5", "Ruili", "Yuntu"],
    "Beijing": ["BJ30", "BJ40", "BJ60", "EU5 Plus", "X5", "X7"],
    "Bestune": ["B50", "B70", "T55", "T77", "T90", "X40", "E01", "M9", "P920"],
    "JAC": ["S2", "S3", "S4", "JS6", "Sei", "T8", "T9", "E-JS4", "X200", "Rei"],
    "Foton": ["Tunland", "Tunland G9", "View CS2", "Toano", "Aumark", "Gratour", "Midi", "iHang"],
    "JMC": ["Vigus", "Terra", "Yuhu", "Temei", "Big Pre"],
    "DFSK": ["Glory 560", "Glory E5", "iBox", "C35", "Super Cab", "Mini Bus"],
    "FAW": ["Besturn T77", "Besturn T90", "J7", "H5", "Oley", "D60", "X80", "Jiefang J6"],
    "Dongfeng": ["T3 Evo", "Rich 6", "Paladin", "M-Hero II", "Aeolus E70", "Sharp Knight P301"],
    "Forthing": ["T5 EVO", "X5", "S50 EV", "Jita", "X3"],
    "Soueast": ["S06", "S07", "FR6", "V6", "T2"],
    "SWM": ["G01", "G05", "X3", "X5", "X7", "Steel K"],
    "VGV": ["VX7", "U70 Plus", "M7", "M7 Pro", "V70"],
    "GWM 212": ["T01", "T01 Diesel", "Yuanzheng", "T01 Expedition"],
    "MG": ["MG3", "MG4", "MG4 XPower", "MG5", "MG6", "MG7", "ZS", "ZS EV", "GT", "RX8", "eHS", "eMG6", "ONE", "G50", "Cyberster", "MG GS"],
    "Proton": ["Saga", "X50", "X70", "X90", "S70", "Persona", "Preve", "Iriz", "Wira"],
    "Perodua": ["Myvi", "Axia", "Bezza", "Ativa", "Alza", "Aruz", "Kenari"],
    "Mahindra": ["XUV700", "Thar", "Bolero", "XUV300", "XUV400", "Scorpio-N", "Alturas G4", "KUV100", "Marazzo", "Pik Up"],
    "Tata": ["Nexon", "Punch", "Harrier", "Safari", "Curvv", "Altroz", "Tiago", "Tigor", "Bolt", "Yodha", "Ace"],
    "KGM": ["Korando", "Korando e-Motion", "Tivoli", "Torres", "Rexton", "Musso", "XLV", "Rexton Sports", "Actyon", "Kyron", "Stavic"],
    "Lada": ["Niva", "Niva Travel", "Niva Legend", "Vesta", "Granta", "Largus", "Iskra", "4x4 Urban"],
    "SsangYong": ["Korando", "Tivoli", "Rexton", "Musso", "XLV", "Actyon", "Kyron", "Istana", "Rezona"],
    "Zenvo": ["TS1 GT", "Aurora Tur", "Aurora Rey"],
    "Hennessey": ["Venom F5", "Venom GT", "VelociRaptor 6x6", "Exorcist", "Mammoth 1000"],
    "SSC": ["Tuatara", "Ultimate Aero", "Nordheimer"],
    "AC Cars": ["Cobra", "378 GT Zagato", "CS Series", "Ace", "Aceca"],
    "TVR": ["Griffith", "Typhoon", "Tuscan", "Cerbera", "Chimera"],
    "Ariel": ["Atom 4", "Atom 3.5", "Nomad", "Hipercar"],
    "Pininfarina": ["Battista", "Pura Vision"],
    "Daihatsu": ["Hijet", "Gran Max", "Ayla", "Sigra", "Sirion", "Terios", "Rocky", "Thor", "Taft", "Copen", "Xenia", "Avanza", "Waku Waku"],

};
const ALIASES = {
    "212": "GWM 212",
    "aldo": "Audi",
    "alfa": "Alfa Romeo",
    "amg": "Mercedes",
    "aston": "Aston Martin",
    "audi ag": "Audi",
    "avtovaz": "Lada",
    "baic arcfox": "Arcfox",
    "baic beijing": "Beijing",
    "baic bj40": "BAIC",
    "benz": "Mercedes",
    "besturn": "Bestune",
    "bimmer": "BMW",
    "bmw m": "BMW",
    "bmw mini": "Mini",
    "brabus g800": "Brabus",
    "buick gm": "Buick",
    "byd auto": "BYD",
    "byd denza": "Denza",
    "byd yangwang": "Yangwang",
    "cadi": "Cadillac",
    "cadilac": "Cadillac",
    "chanauto": "Changan",
    "changan auto": "Changan",
    "changan avatr": "Avatr",
    "changcheng 212": "GWM 212",
    "chery auto": "Chery",
    "chery exeed": "Exeed",
    "chery icar": "iCar",
    "chev": "Chevrolet",
    "chevrilet": "Chevrolet",
    "chevy": "Chevrolet",
    "citroen france": "Citroen",
    "dodge ram": "RAM",
    "dongfeng forthing": "Forthing",
    "dongfeng voyah": "Voyah",
    "eagle": "Chrysler",
    "faw bestune": "Bestune",
    "faw jiefang": "FAW",
    "ford motors": "Ford",
    "ford usa": "Ford",
    "forthing t5 evo": "Forthing",
    "foton motor": "Foton",
    "gac aion": "Aion",
    "gac hyptec": "GAC",
    "gac motor": "GAC",
    "geely auto": "Geely",
    "geely radar": "Riddara",
    "general motors": "Chevrolet",
    "genesis motors": "Genesis",
    "gmc sierra": "GMC",
    "great wall 212": "GWM 212",
    "great wall motors": "Great Wall",
    "great wall tank": "Tank",
    "greatwall haval": "Haval",
    "gwm": "Great Wall",
    "gwm tank 300": "Tank",
    "honda motors": "Honda",
    "hongqi red flag": "Hongqi",
    "hundai": "Hyundai",
    "hyundai motors": "Hyundai",
    "icar 03": "iCar",
    "ideal auto": "Li Auto",
    "infiniti premium": "Infiniti",
    "isuzu motors": "Isuzu",
    "jac motors": "JAC",
    "jeep wrangler": "Jeep",
    "jetour auto": "Jetour",
    "jianghuai": "JAC",
    "jiangling": "JMC",
    "kaiyi auto": "Kaiyi",
    "karry": "Kaiyi",
    "kia moto rs": "Kia",
    "kia motors": "Kia",
    "lambo": "Lamborghini",
    "lamborgini": "Lamborghini",
    "land cruiser toyota": "Toyota",
    "leapmotor intl": "Leapmotor",
    "lexux": "Lexus",
    "li auto ideal": "Li Auto",
    "lincoln motor": "Lincoln",
    "lotus cars": "Lotus",
    "lucid air": "Lucid",
    "lucid motors": "Lucid",
    "lumma design": "Lumma",
    "lynk and co": "Lynk & Co",
    "mahindra & mahindra": "Mahindra",
    "maruti": "Suzuki",
    "maruti suzuki": "Suzuki",
    "maserati tr": "Maserati",
    "maybach 57": "Maybach",
    "mazda motors": "Mazda",
    "mb": "Mercedes",
    "mclaren automotive": "McLaren",
    "mercedes benz": "Mercedes",
    "mercedes maybach": "Maybach",
    "mercedes-benz": "Mercedes",
    "mg motor": "MG",
    "mini cooper": "Mini",
    "miti": "Mitsubishi",
    "mitsubishi motors": "Mitsubishi",
    "morris garages": "MG",
    "nio inc": "NIO",
    "nisan": "Nissan",
    "nissan motor": "Nissan",
    "nissian": "Nissan",
    "omoda jaecoo": "Omoda",
    "omooda": "Omoda",
    "p2msa": "Proton",
    "pegeot": "Peugeot",
    "perodua malaysia": "Perodua",
    "peugeot citroen": "Peugeot",
    "polestar engines": "Polestar",
    "pontiac": "Chevrolet",
    "porche": "Porsche",
    "prado": "Toyota",
    "radar": "Riddara",
    "ram trucks": "RAM",
    "rang rover": "Range Rover",
    "red flag": "Hongqi",
    "renault alpine": "Alpine",
    "renault dacia": "Dacia",
    "rolls": "Rolls-Royce",
    "rover": "Range Rover",
    "saic ldv": "LDV",
    "saic maxus": "Maxus",
    "saic mg": "MG",
    "scion frs": "Scion",
    "skoda auto": "Skoda",
    "smart eq": "Smart",
    "soueast motor": "Soueast",
    "srt swm": "SWM",
    "ssangyong motors": "KGM",
    "startech": "Mansory",
    "subaru corp": "Subaru",
    "tata motors": "Tata",
    "tesla motors": "Tesla",
    "toyota land cruiser": "Toyota",
    "toyota landcruiser": "Toyota",
    "toyota motor": "Toyota",
    "trumpchi": "GAC",
    "volkswage": "Volkswagen",
    "volkswagen ag": "Volkswagen",
    "volkswagon": "Volkswagen",
    "volvo polestar": "Polestar",
    "vw": "Volkswagen",
    "xiaopeng": "XPeng",
    "xpeng motors": "XPeng",
    "zeekr auto": "Zeekr",
    "zekr": "Zeekr",

};
/** بدون فاصله/علامت/حرف بزرگ — برای مقایسه‌ی نام‌ها */
export function normKeyBase(value) {
    return String(value == null ? "" : value)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

const BY_NORMALIZED = new Map();

for (const [name, models] of Object.entries(DATA)) {
    BY_NORMALIZED.set(normKeyBase(name), { name, models: Array.isArray(models) ? models.slice() : [] });
}

for (const [alias, canonical] of Object.entries(ALIASES)) {
    const hit = BY_NORMALIZED.get(normKeyBase(canonical));

    if (hit && !BY_NORMALIZED.has(normKeyBase(alias))) {
        BY_NORMALIZED.set(normKeyBase(alias), hit);
    }
}

/**
 * نام → کلید مقایسه. alias ها هم تا می‌شوند، پس «Mercedes-Benz» و «benz»
 * و «MERCEDES» همه یک چیزند و در کمبوکس تکراری نمی‌شوند.
 */
export function normKey(name) {
    const base = normKeyBase(name);

    if (!base) {
        return "";
    }

    const hit = BY_NORMALIZED.get(base);

    return hit ? normKeyBase(hit.name) : base;
}

export const GLOBAL_BRANDS = Object.keys(DATA).map((name) => ({
    name,
    models: Array.isArray(DATA[name]) ? DATA[name].slice() : [],
}));

export const GLOBAL_BRAND_NAMES = GLOBAL_BRANDS.map((brand) => brand.name);
export const GLOBAL_BRAND_COUNT = GLOBAL_BRANDS.length;
export const GLOBAL_MODEL_COUNT = GLOBAL_BRANDS.reduce((sum, brand) => sum + brand.models.length, 0);

function lookup(brandName) {
    const key = normKey(brandName);

    return key ? BY_NORMALIZED.get(key) : null;
}

/** مدل‌های آماده‌ی یک برند (آرایه‌ی خالی اگر آن برند را نمی‌شناسیم) */
export function globalModelsFor(brandName) {
    const hit = lookup(brandName);

    return hit ? hit.models.slice() : [];
}

/** نام canonical («mercedes» → «Mercedes») تا payload تمیز بماند */
export function canonicalBrandName(brandName) {
    const hit = lookup(brandName);

    return hit ? hit.name : String(brandName == null ? "" : brandName).trim();
}

export function isKnownBrand(brandName) {
    return Boolean(lookup(brandName));
}

/**
 * کاتالوگ سرور + کاتالوگ جهانی.
 *   • برندهای سرور اول می‌آیند (id واقعی دارند، ترتیب فعلی حفظ می‌شود)
 *   • مدل‌های جهانی که سرور ندارد به همان برند اضافه می‌شوند (from_db:false)
 *   • برندهای جهانیِ باقی‌مانده به ترتیب اولویت بازار ته لیست می‌آیند
 * هر برند/مدل فلگ from_db دارد تا UI فرق «دیتابیس» و «لیست آماده» را بفهمد.
 */
export function mergeGlobalCatalog(dbBrands) {
    const list = Array.isArray(dbBrands) ? dbBrands : [];
    const used = new Set();
    const merged = [];

    for (const brand of list) {
        const name = String(brand?.name == null ? "" : brand.name).trim();

        if (!name) {
            continue;
        }

        const key = normKey(name);

        used.add(key);

        const dbModels = (Array.isArray(brand.models) ? brand.models : []).map((model) => ({
            ...model,
            from_db: Boolean(model?.id),
        }));

        const seen = new Set(dbModels.map((model) => normKey(model?.name)));
        const extra = globalModelsFor(name)
            .filter((model) => !seen.has(normKey(model)))
            .map((model) => ({
                id: null,
                name: model,
                brand_id: brand.id ?? null,
                in_catalog: false,
                from_db: false,
            }));

        merged.push({ ...brand, name, models: [...dbModels, ...extra] });
    }

    for (const brand of GLOBAL_BRANDS) {
        const key = normKey(brand.name);

        if (used.has(key)) {
            continue;
        }

        used.add(key);

        merged.push({
            id: null,
            name: brand.name,
            in_catalog: false,
            is_global: true,
            cars_count: 0,
            models: brand.models.map((model) => ({
                id: null,
                name: model,
                brand_id: null,
                in_catalog: false,
                from_db: false,
            })),
        });
    }

    return merged;
}

/** چند برند فقط از «لیست آماده» آمده‌اند؟ (برای پیام کوتاه بالای فرم) */
export function countReadyOnlyBrands(brands) {
    return (Array.isArray(brands) ? brands : []).filter((brand) => brand?.is_global === true).length;
}

export default mergeGlobalCatalog;
