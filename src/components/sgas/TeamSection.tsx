"use client";

import Image from "next/image";
import { useLang } from "@/components/sgas/LanguageProvider";
import { Crown, Shield, BookOpen, Users, Megaphone, GraduationCap, Star } from "lucide-react";

interface TeamMember {
  nameEn: string;
  nameAr: string;
  roleEn: string;
  roleAr: string;
  university: "cairo" | "ainshams";
  image?: string;
  icon: typeof Crown;
}

const teamMembers: TeamMember[] = [
  {
    nameEn: "Johnny Hany Shohdy",
    nameAr: "جوني هاني شهدي",
    roleEn: "Founder & President",
    roleAr: "المؤسس والرئيس",
    university: "cairo",
    image: "/team-johnny.png",
    icon: Crown,
  },
  {
    nameEn: "Ali Hossam",
    nameAr: "علي حسام",
    roleEn: "Vice President & Co-Founder Assistant",
    roleAr: "نائب الرئيس ومساعد المؤسس",
    university: "cairo",
    image: "/team-ali.png",
    icon: Shield,
  },
  {
    nameEn: "Gann Hossam",
    nameAr: "جنه حسام",
    roleEn: "HR Manager",
    roleAr: "مدير الموارد البشرية",
    university: "cairo",
    image: "/team-ganna.png",
    icon: Users,
  },
  {
    nameEn: "Ahmed Fahmy",
    nameAr: "أحمد فهمي",
    roleEn: "Coaching Actuaries Ambassador & Academic Leader",
    roleAr: "سفير Coaching Actuaries والقائد الأكاديمي",
    university: "cairo",
    image: "/team-fahmy.png",
    icon: BookOpen,
  },
  {
    nameEn: "Shahd Abdelsalam",
    nameAr: "شهد عبد السلام",
    roleEn: "HR Assistant",
    roleAr: "مساعدة مدير الموارد البشرية",
    university: "cairo",
    image: "/team-shahd.png",
    icon: Users,
  },
  {
    nameEn: "Ebrahim Aymn",
    nameAr: "إبراهيم أيمن",
    roleEn: "Media Controller",
    roleAr: "مسؤول الإعلام",
    university: "cairo",
    icon: Megaphone,
  },
  {
    nameEn: "Mohamed Abdelkafi",
    nameAr: "محمد عبد القافي",
    roleEn: "Academic Leader Assistant",
    roleAr: "مساعد القائد الأكاديمي",
    university: "cairo",
    image: "/team-mohamed.png",
    icon: GraduationCap,
  },
  {
    nameEn: "Salma",
    nameAr: "سلمى",
    roleEn: "Ain Shams University Ambassador",
    roleAr: "سفيرة جامعة عين شمس",
    university: "ainshams",
    icon: Star,
  },
];

export default function TeamSection() {
  const { lang } = useLang();

  return (
    <section id="team" className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm font-semibold mb-4">
            {lang === "en" ? "Our Team" : "فريقنا"}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {lang === "en" ? "Meet the " : "تعرف على "}
            <span className="text-brand-700">{lang === "en" ? "SGAS Team" : "فريق SGAS"}</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {lang === "en"
              ? "The dedicated team behind SGAS, working together to build the best community for actuarial science students in Egypt."
              : "الفريق الم dedicatd الذي يقف خلف SGAS، يعملون معاً لبناء أفضل مجتمع لطلاب العلوم الاكتوارية في مصر."}
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, index) => {
            const IconComp = member.icon;
            const isCairo = member.university === "cairo";
            const borderColor = index === 0
              ? "border-amber-300 hover:border-amber-400"
              : isCairo
              ? "border-brand-200 hover:border-brand-400"
              : "border-red-brand-200 hover:border-red-brand-400";

            const iconBg = index === 0
              ? "bg-amber-100 text-amber-600"
              : isCairo
              ? "bg-brand-100 text-brand-600"
              : "bg-red-brand-100 text-red-brand-600";

            const badgeBg = index === 0
              ? "bg-amber-100 text-amber-700 border-amber-200"
              : isCairo
              ? "bg-brand-100 text-brand-700 border-brand-200"
              : "bg-red-brand-100 text-red-brand-700 border-red-brand-200";

            return (
              <div
                key={index}
                className={`group bg-white rounded-2xl border ${borderColor} p-6 text-center hover:shadow-xl transition-all duration-500 relative overflow-hidden`}
              >
                {/* University Badge */}
                <span
                  className={`absolute top-3 end-3 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeBg}`}
                >
                  {isCairo
                    ? lang === "en" ? "Cairo Uni" : "جامعة القاهرة"
                    : lang === "en" ? "Ain Shams Uni" : "عين شمس"}
                </span>

                {/* Photo or Initials */}
                <div className="relative w-24 h-24 mx-auto mb-4">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.nameEn}
                      fill
                      className="rounded-full object-cover group-hover:scale-105 transition-transform duration-300 shadow-lg"
                    />
                  ) : (
                    <div className={`w-24 h-24 rounded-full ${iconBg} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                      <IconComp className="h-10 w-10" />
                    </div>
                  )}

                  {/* Founder Badge for first member */}
                  {index === 0 && (
                    <div className="absolute -bottom-1 -end-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                      <Crown className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {lang === "en" ? member.nameEn : member.nameAr}
                </h3>

                {/* Role */}
                <p className="text-sm text-brand-600 font-medium mb-3 leading-relaxed">
                  {lang === "en" ? member.roleEn : member.roleAr}
                </p>

                {/* Decorative line */}
                <div className="w-12 h-0.5 bg-gradient-to-r from-brand-400 to-red-brand-400 mx-auto rounded-full opacity-50" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
