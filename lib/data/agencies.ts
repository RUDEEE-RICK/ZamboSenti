import {
  Activity,
  Briefcase,
  Building2,
  FileText,
  Globe,
  Heart,
  Landmark,
  Shield,
  Truck,
  UserCheck,
  Users,
} from "lucide-react";

export const agencies = [
  {
    name: "Philippine Statistics Authority (PSA)",
    href: "https://psa.gov.ph/",
    icon: UserCheck,
    description:
      "Access your Digital National ID (PhilSys), request Birth, Marriage, and Death certificates, and manage civil registry documents.",
  },
  {
    name: "Government Service Insurance System (GSIS)",
    href: "https://www.gsis.gov.ph/",
    icon: Shield,
    description:
      "View membership records, check loan status, and access social insurance benefits for government employees.",
  },
  {
    name: "Social Security System (SSS)",
    href: "https://www.sss.gov.ph/",
    icon: Users,
    description:
      "Manage private sector social security contributions, apply for salary loans, and view benefit claims.",
  },
  {
    name: "Philippine Health Insurance Corp. (PhilHealth)",
    href: "https://www.philhealth.gov.ph/",
    icon: Heart,
    description:
      "Access your virtual PhilHealth ID, check contribution history, and view member benefits.",
  },
  {
    name: "Pag-IBIG Fund (HDMF)",
    href: "https://www.pagibigfund.gov.ph/",
    icon: Building2,
    description:
      "Manage housing loans, view MP2 savings, and check regular contribution records.",
  },
  {
    name: "Land Transportation Office (LTO)",
    href: "https://lto.gov.ph/",
    icon: Truck,
    description:
      "Access your Digital Driver’s License, view violations, and renew motor vehicle registration.",
  },
  {
    name: "Department of Foreign Affairs (DFA)",
    href: "https://dfa.gov.ph/",
    icon: Globe,
    description:
      "Schedule passport appointments and view requirements for passport renewal and application.",
  },
  {
    name: "Professional Regulation Commission (PRC)",
    href: "https://www.prc.gov.ph/",
    icon: Briefcase,
    description:
      "Access your Digital PRC Professional ID, renew licenses, and verify professional standing.",
  },
  {
    name: "Bureau of Internal Revenue (BIR)",
    href: "https://www.bir.gov.ph/",
    icon: FileText,
    description:
      "Verify Taxpayer Identification Number (TIN) and access tax payment services via eGovPay.",
  },
  {
    name: "National Bureau of Investigation (NBI)",
    href: "https://nbi.gov.ph/",
    icon: FileText,
    description:
      "Apply for NBI Clearance, schedule appointments, and renew existing clearances.",
  },
  {
    name: "Philippine National Police (PNP)",
    href: "https://pnp.gov.ph/",
    icon: Shield,
    description:
      "Apply for National Police Clearance and report crimes or emergencies via eReport.",
  },
  {
    name: "Department of Migrant Workers (DMW) / OWWA",
    href: "https://www.dmw.gov.ph/",
    icon: Globe,
    description:
      "Access the OFW Pass, manage Overseas Employment Certificates (OEC), and access welfare services.",
  },
  {
    name: "Department of Tourism (DOT)",
    href: "https://dot.gov.ph/",
    icon: Activity,
    description:
      "Access eTravel for customs and border control declarations and explore tourism information.",
  },
  {
    name: "Department of Trade and Industry (DTI)",
    href: "https://www.dti.gov.ph/",
    icon: Briefcase,
    description:
      "Business name registration services and consumer protection reporting.",
  },
  {
    name: "Local Government Units (DILG)",
    href: "https://dilg.gov.ph/",
    icon: Landmark,
    description:
      "Access local services such as Business Permits, Community Tax Certificates (Cedula), and Real Property Tax payments.",
  },
];
