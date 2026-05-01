/**
 * Comprehensive list of medical specializations grouped by category.
 * Used in doctor registration and clinic doctor-add forms.
 */
export const SPECIALIZATION_GROUPS = [
  {
    group: 'Internal Medicine',
    options: [
      'General Medicine',
      'Internal Medicine',
      'Family Medicine',
      'General Practice',
      'Emergency Medicine',
      'Geriatrics',
      'Palliative Care',
    ],
  },
  {
    group: 'Cardiology & Vascular',
    options: [
      'Cardiology',
      'Interventional Cardiology',
      'Cardiac Electrophysiology',
      'Vascular Surgery',
      'Cardiac Surgery',
    ],
  },
  {
    group: 'Neurology & Brain',
    options: [
      'Neurology',
      'Neurosurgery',
      'Neuropsychiatry',
      'Pediatric Neurology',
      'Neuroradiology',
    ],
  },
  {
    group: 'Orthopedics & Bones',
    options: [
      'Orthopedics',
      'Orthopedic Surgery',
      'Sports Medicine',
      'Rheumatology',
      'Spine Surgery',
      'Hand Surgery',
    ],
  },
  {
    group: 'Surgery',
    options: [
      'General Surgery',
      'Laparoscopic Surgery',
      'Plastic Surgery',
      'Reconstructive Surgery',
      'Bariatric Surgery',
      'Colorectal Surgery',
      'Transplant Surgery',
    ],
  },
  {
    group: 'Women\'s Health',
    options: [
      'Obstetrics & Gynecology',
      'Gynecology',
      'Maternal-Fetal Medicine',
      'Reproductive Endocrinology',
      'Urogynaecology',
    ],
  },
  {
    group: 'Pediatrics',
    options: [
      'Pediatrics',
      'Neonatology',
      'Pediatric Surgery',
      'Pediatric Cardiology',
      'Pediatric Oncology',
      'Pediatric Endocrinology',
    ],
  },
  {
    group: 'Mental Health',
    options: [
      'Psychiatry',
      'Child Psychiatry',
      'Addiction Medicine',
      'Psychosomatic Medicine',
      'Forensic Psychiatry',
    ],
  },
  {
    group: 'Eyes, ENT & Skin',
    options: [
      'Ophthalmology',
      'ENT (Ear, Nose & Throat)',
      'Otolaryngology',
      'Dermatology',
      'Cosmetology',
      'Allergy & Immunology',
    ],
  },
  {
    group: 'Oncology & Blood',
    options: [
      'Oncology',
      'Medical Oncology',
      'Radiation Oncology',
      'Surgical Oncology',
      'Hematology',
      'Hematology-Oncology',
      'Bone Marrow Transplant',
    ],
  },
  {
    group: 'Gastroenterology',
    options: [
      'Gastroenterology',
      'Hepatology',
      'Colorectal Medicine',
      'Liver Transplant',
    ],
  },
  {
    group: 'Urology & Nephrology',
    options: [
      'Urology',
      'Nephrology',
      'Andrology',
      'Renal Transplant',
    ],
  },
  {
    group: 'Endocrinology & Metabolism',
    options: [
      'Endocrinology',
      'Diabetology',
      'Thyroid Medicine',
      'Obesity Medicine',
    ],
  },
  {
    group: 'Pulmonology & Critical Care',
    options: [
      'Pulmonology',
      'Critical Care Medicine',
      'Sleep Medicine',
      'Respiratory Medicine',
    ],
  },
  {
    group: 'Radiology & Imaging',
    options: [
      'Radiology',
      'Interventional Radiology',
      'Nuclear Medicine',
      'Pathology',
      'Clinical Pathology',
    ],
  },
  {
    group: 'Dental & Oral',
    options: [
      'Dentistry',
      'Oral & Maxillofacial Surgery',
      'Orthodontics',
      'Periodontics',
      'Endodontics',
      'Prosthodontics',
      'Pediatric Dentistry',
    ],
  },
  {
    group: 'Other',
    options: [
      'Anesthesiology',
      'Pain Management',
      'Physical Medicine & Rehabilitation',
      'Occupational Medicine',
      'Tropical Medicine',
      'Aviation Medicine',
      'Infectious Disease',
      'Immunology',
    ],
  },
];

/** Flat sorted array — useful for simple select/search */
export const SPECIALIZATIONS_FLAT = SPECIALIZATION_GROUPS
  .flatMap(g => g.options)
  .sort((a, b) => a.localeCompare(b));
