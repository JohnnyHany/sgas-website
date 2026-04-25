"use client";

import Image from "next/image";
import { useLang } from "@/components/sgas/LanguageProvider";
import { Crown, Shield, BookOpen, Users, Megaphone, GraduationCap, Star, Mail } from "lucide-react";
import { useState } from "react";

interface TeamMember {
  nameEn: string;
  nameAr: string;
  roleEn: string;
  roleAr: string;
  bioEn: string;
  bioAr: string;
  university: "cairo" | "ainshams";
  image?: string;
  icon: typeof Crown;
  email?: string;
}

const teamMembers: TeamMember[] = [
  {
    nameEn: "Johnny Hany",
    nameAr: "جوني هاني",
    roleEn: "Founder & President",
    roleAr: "المؤسس والرئيس",
    bioEn: "Founder of SGAS - Strive and Grow in Actuarial Science. A third-year actuarial science student at Cairo University, Faculty of Commerce. Passionate about building a strong community for actuarial students and bridging the gap between academia and the professional world.",
    bioAr: "مؤسس SGAS - اجتهد وانمُ في العلوم الاكتوارية. طالب بسنة تالتة علوم اكتوارية بكلية التجارة - جامعة القاهرة. شغوف ببناء مجتمع قوي لطلاب الاكتوار وربط الجسر بين الأكاديميا وسوق العمل.",
    university: "cairo",
    image: "/team-johnny.png",
    icon: Crown,
    email: "JohnnyHany399@gmail.com",
  },
  {
    nameEn: "Ali Hossam",
    nameAr: "علي حسام",
    roleEn: "Vice President & Co-Founder Assistant",
    roleAr: "نائب الرئيس ومساعد المؤسس",
    bioEn: "Vice President of SGAS and right-hand to the founder. Plays a key role in strategic planning and overseeing all SGAS operations and initiatives.",
    bioAr: "نائب رئيس SGAS واليد اليمنى للمؤسس. يلعب دور رئيسي في التخطيط الاستراتيجي والإشراف على جميع عمليات ومبادرات SGAS.",
    university: "cairo",
    image: "/team-ali.png",
    icon: Shield,
    email: "alibedawy966@gmail.com",
  },
  {
    nameEn: "Gann Hossam",
    nameAr: "جنه حسام",
    roleEn: "HR Manager",
    roleAr: "مدير الموارد البشرية",
    bioEn: "Heads the Human Resources department at SGAS. Responsible for team coordination, member management, and ensuring a positive and productive team environment.",
    bioAr: "تترأس قسم الموارد البشرية في SGAS. مسؤولة عن تنسيق الفريق وإدارة الأعضاء وضمان بيئة عمل إيجابية ومثمرة.",
    university: "cairo",
    image: "/team-ganna.png",
    icon: Users,
    email: "hossamganna3@gmail.com",
  },
  {
    nameEn: "Ahmed Fahmy",
    nameAr: "أحمد فهمي",
    roleEn: "Coaching Actuaries Ambassador & Academic Leader",
    roleAr: "سفير Coaching Actuaries والقائد الأكاديمي",
    bioEn: "Serves as the official Coaching Actuaries Ambassador and leads the academic direction of SGAS. Provides guidance on professional certifications and academic development for all members.",
    bioAr: "يعمل كسفير رسمي لـ Coaching Actuaries ويقود التوجه الأكاديمي لـ SGAS. يقدم إرشادات حول الشهادات المهنية والتطوير الأكاديمي لجميع الأعضاء.",
    university: "cairo",
    image: "/team-fahmy.png",
    icon: BookOpen,
    email: "Fahmyhamed123@gmail.com",
  },
  {
    nameEn: "Shahd Abdelsalam",
    nameAr: "شهد عبد السلام",
    roleEn: "HR Assistant",
    roleAr: "مساعدة مدير الموارد البشرية",
    bioEn: "Assists the HR Manager in team coordination, member communications, and organizing internal SGAS activities and events.",
    bioAr: "تساعد مدير الموارد البشرية في تنسيق الفريق، تواصل الأعضاء، وتنظيم الأنشطة والفعاليات الداخلية لـ SGAS.",
    university: "cairo",
    image: "/team-shahd.png",
    icon: Users,
    email: "shahd.abdelsalam1326@gmail.com",
  },
  {
    nameEn: "Ebrahim Aymn",
    nameAr: "إبراهيم أيمن",
    roleEn: "Media Controller",
    roleAr: "مسؤول الإعلام",
    bioEn: "Manages all media and content creation for SGAS. Responsible for social media presence, graphic design, photography, and brand identity across all platforms.",
    bioAr: "يتولى إدارة جميع وسائل الإعلام وإنشاء المحتوى لـ SGAS. مسؤول عن الحضور على منصات التواصل الاجتماعي، التصميم الجرافيكي، والتصوير.",
    university: "cairo",
    image: "/team-ibrahim.jpg",
    icon: Megaphone,
    email: "ebrahimayman2262@gmail.com",
  },
  {
    nameEn: "Mohamed Abdelkafi",
    nameAr: "محمد عبد الكافي",
    roleEn: "Academic Leader Assistant",
    roleAr: "مساعد القائد الأكاديمي",
    bioEn: "Assists the Academic Leader in managing study materials, organizing academic workshops, and supporting students with their coursework and exam preparation.",
    bioAr: "يساعد القائد الأكاديمي في إدارة المواد الدراسية، تنظيم ورش العمل الأكاديمية، ودعم الطلاب في دراستهم واستعدادهم للامتحانات.",
    university: "cairo",
    image: "/team-mohamed.png",
    icon: GraduationCap,
    email: "mbdalkafy19@gmail.com",
  },
  {
    nameEn: "Salma Mohamed",
    nameAr: "سلمى محمد",
    roleEn: "Ain Shams University Ambassador",
    roleAr: "سفيرة جامعة عين شمس",
    bioEn: "The official SGAS ambassador at Ain Shams University. Responsible for representing SGAS, coordinating activities, and expanding the community at Ain Shams.",
    bioAr: "سفيرة SGAS الرسمية في جامعة عين شمس. مسؤولة عن تمثيل SGAS وتنسيق الأنشطة وتوسيع المجتمع في جامعة عين شمس.",
    university: "ainshams",
    image: "/team-salma.jpg",
    icon: Star,
    email: "salmamahmoud7454@gmail.com",
  },
];

function MemberModal({ member, lang, onClose }: { member: TeamMember; lang: "en" | "ar"; onClose: () => void }) {
  const isCairo = member.university === "cairo";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
        >
          ✕
        </button>

        {/* Photo */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-28 h-28 mb-4 overflow-hidden rounded-full">
            {member.image ? (
              <Image
                src={member.image}
                alt={member.nameEn}
                fill
                sizes="112px"
                className="rounded-full object-cover object-top"
                style={{ objectPosition: 'center 15%' }}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-brand-100 flex items-center justify-center shadow-lg">
                <member.icon className="h-12 w-12 text-brand-600" />
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {lang === "en" ? member.nameEn : member.nameAr}
          </h3>
          <p className="text-sm text-brand-600 font-medium mt-1">
            {lang === "en" ? member.roleEn : member.roleAr}
          </p>
          <span className={`mt-2 text-xs font-semibold px-3 py-1 rounded-full border ${
            isCairo
              ? "bg-brand-100 text-brand-700 border-brand-200"
              : "bg-red-brand-100 text-red-brand-700 border-red-brand-200"
          }`}>
            {isCairo
              ? (lang === "en" ? "Cairo University" : "جامعة القاهرة")
              : (lang === "en" ? "Ain Shams University" : "جامعة عين شمس")}
          </span>
        </div>

        {/* Bio */}
        <p className="text-gray-600 text-sm leading-relaxed mb-6 text-center">
          {lang === "en" ? member.bioEn : member.bioAr}
        </p>

        {/* Email */}
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-medium text-sm transition-colors border border-brand-200"
          >
            <Mail className="h-4 w-4" />
            {member.email}
          </a>
        )}
      </div>
    </div>
  );
}

export default function TeamSection() {
  const { lang } = useLang();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

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
              : "الفريق الملتزم الذي يقف خلف SGAS، يعملون معاً لبناء أفضل مجتمع لطلاب العلوم الاكتوارية في مصر."}
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, index) => {
            const IconComp = member.icon;
            const isCairo = member.university === "cairo";
            const borderColor = isCairo
              ? "border-brand-200 hover:border-brand-400"
              : "border-red-brand-200 hover:border-red-brand-400";

            const badgeBg = isCairo
              ? "bg-brand-100 text-brand-700 border-brand-200"
              : "bg-red-brand-100 text-red-brand-700 border-red-brand-200";

            return (
              <div
                key={index}
                onClick={() => setSelectedMember(member)}
                className={`group bg-white rounded-2xl border ${borderColor} p-6 text-center hover:shadow-xl transition-all duration-500 relative overflow-hidden cursor-pointer`}
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
                <div className="relative w-24 h-24 mx-auto mb-5 overflow-hidden rounded-full">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.nameEn}
                      fill
                      sizes="96px"
                      className="rounded-full object-cover object-top"
                      style={{ objectPosition: 'center 15%' }}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shadow-lg">
                      <IconComp className="h-10 w-10" />
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

                {/* Email hint */}
                {member.email && (
                  <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <Mail className="h-3 w-3" />
                    {lang === "en" ? "Click to view profile" : "اضغط لعرض الملف الشخصي"}
                  </p>
                )}

                {/* Decorative line */}
                <div className="w-12 h-0.5 bg-gradient-to-r from-brand-400 to-red-brand-400 mx-auto rounded-full opacity-50 mt-3" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {selectedMember && (
        <MemberModal
          member={selectedMember}
          lang={lang}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </section>
  );
}