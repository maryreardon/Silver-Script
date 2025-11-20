import React from 'react';
import { LessonTopic } from '../types';
import { BookOpen, Code, Cpu, Globe } from 'lucide-react';

interface LessonCardProps {
  topic: LessonTopic;
  onClick: (topic: LessonTopic) => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({ topic, onClick }) => {
  
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'cpu': return <Cpu size={48} className="text-emerald-700" />;
      case 'globe': return <Globe size={48} className="text-blue-700" />;
      case 'code': return <Code size={48} className="text-purple-700" />;
      default: return <BookOpen size={48} className="text-slate-700" />;
    }
  };

  return (
    <div 
      onClick={() => onClick(topic)}
      className="bg-white border-2 border-slate-200 rounded-2xl p-8 hover:border-emerald-500 hover:shadow-xl transition-all cursor-pointer flex flex-col items-center text-center gap-4 group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick(topic);
        }
      }}
      aria-label={`Start lesson: ${topic.title}`}
    >
      <div className="bg-slate-100 p-6 rounded-full group-hover:bg-emerald-50 transition-colors">
        {getIcon(topic.icon)}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">{topic.title}</h3>
        <p className="text-lg text-slate-600 leading-relaxed">{topic.description}</p>
      </div>
      <div className="mt-2 px-4 py-1 bg-slate-100 rounded-full text-slate-600 font-medium">
        {topic.level}
      </div>
    </div>
  );
};
