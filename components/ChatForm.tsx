'use client';

import { useState, FormEvent } from 'react';

interface CampaignForm {
  mainTheme: string;
  audienceProfile: string;
  campaignGoal: string;
  brandVoice?: string;
  callToAction?: string;
  offerDescription?: string;
  contextNotes?: string;
}

interface ChatFormProps {
  onSubmit: (data: CampaignForm) => void;
  disabled?: boolean;
}

export default function ChatForm({ onSubmit, disabled }: ChatFormProps) {
  const [mainTheme, setMainTheme] = useState('');
  const [audienceProfile, setAudienceProfile] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('');
  const [brandVoice, setBrandVoice] = useState('');
  const [callToAction, setCallToAction] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [contextNotes, setContextNotes] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      mainTheme: mainTheme.trim(),
      audienceProfile: audienceProfile.trim(),
      campaignGoal: campaignGoal.trim(),
      brandVoice: brandVoice.trim() || undefined,
      callToAction: callToAction.trim() || undefined,
      offerDescription: offerDescription.trim() || undefined,
      contextNotes: contextNotes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="mainTheme" className="block text-sm font-medium mb-2">
          Tema central de la campaña <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="mainTheme"
          value={mainTheme}
          onChange={(e) => setMainTheme(e.target.value)}
          placeholder="p.ej., Cómo liderar adopción de IA en empresas B2B"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          disabled={disabled}
        />
      </div>

      <div>
        <label htmlFor="audienceProfile" className="block text-sm font-medium mb-2">
          Perfil de audiencia <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="audienceProfile"
          value={audienceProfile}
          onChange={(e) => setAudienceProfile(e.target.value)}
          placeholder="p.ej., CEOs de SaaS en crecimiento que buscan eficiencia comercial"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          disabled={disabled}
        />
      </div>

      <div>
        <label htmlFor="campaignGoal" className="block text-sm font-medium mb-2">
          Objetivo de la campaña <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="campaignGoal"
          value={campaignGoal}
          onChange={(e) => setCampaignGoal(e.target.value)}
          placeholder="p.ej., Generar leads calificados para asesorías de transformación digital"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          disabled={disabled}
        />
      </div>

      <div>
        <label htmlFor="brandVoice" className="block text-sm font-medium mb-2">
          Voz de marca deseada <span className="text-gray-400">(opcional)</span>
        </label>
        <input
          type="text"
          id="brandVoice"
          value={brandVoice}
          onChange={(e) => setBrandVoice(e.target.value)}
          placeholder="p.ej., Energía high-performance, cero humo, storytelling directo"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={disabled}
        />
      </div>

      <div>
        <label htmlFor="callToAction" className="block text-sm font-medium mb-2">
          CTA prioritario <span className="text-gray-400">(opcional)</span>
        </label>
        <input
          type="text"
          id="callToAction"
          value={callToAction}
          onChange={(e) => setCallToAction(e.target.value)}
          placeholder="p.ej., Agenda una sesión gratuita y comenta 'Playbook'"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={disabled}
        />
      </div>

      <div>
        <label htmlFor="offerDescription" className="block text-sm font-medium mb-2">
          Oferta o producto a resaltar <span className="text-gray-400">(opcional)</span>
        </label>
        <input
          type="text"
          id="offerDescription"
          value={offerDescription}
          onChange={(e) => setOfferDescription(e.target.value)}
          placeholder="p.ej., Programa 1:1 de liderazgo digital o ebook descargable"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={disabled}
        />
      </div>

      <div>
        <label htmlFor="contextNotes" className="block text-sm font-medium mb-2">
          Contexto o links clave <span className="text-gray-400">(opcional)</span>
        </label>
        <textarea
          id="contextNotes"
          value={contextNotes}
          onChange={(e) => setContextNotes(e.target.value)}
          placeholder="Comparte insights internos, métricas, competidores o restricciones de la marca."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
          disabled={disabled}
        />
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {disabled ? 'Generando...' : 'Generar campaña viral'}
      </button>
    </form>
  );
}


