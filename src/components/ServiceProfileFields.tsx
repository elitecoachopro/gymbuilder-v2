'use client';

import { SERVICE_CATEGORIES, hasServices, type ServiceProfileValues, type ProviderBusinessType } from '@/lib/gym-services';
import { useClientLocale } from '@/i18n/client';

export default function ServiceProfileFields({ value, onChange, disabled = false }: { value: ServiceProfileValues; onChange: (value: ServiceProfileValues) => void; disabled?: boolean }) {
  const en = useClientLocale() === 'en';
  return <fieldset disabled={disabled} className="space-y-4 disabled:opacity-60">
    <legend className="mb-3 text-lg font-semibold text-white">Gym Service {en ? '& Maintenance' : 'și Mentenanță'}</legend>
    <label className="block text-sm font-medium text-anthracite-200">{en ? 'What do you offer?' : 'Ce oferi?'}
      <select className="input-field mt-2 min-h-12" value={value.businessType} onChange={e => onChange({ ...value, businessType: e.target.value as ProviderBusinessType })}>
        <option value="equipment">{en ? 'Fitness equipment' : 'Echipamente fitness'}</option>
        <option value="service">{en ? 'Service and maintenance' : 'Service și mentenanță'}</option>
        <option value="both">{en ? 'Equipment + service' : 'Echipamente + service'}</option>
      </select>
    </label>
    {hasServices(value.businessType) && <>
      <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium text-anthracite-200">{en ? 'Services offered *' : 'Servicii oferite *'}</legend>
        {SERVICE_CATEGORIES.map(category => <label key={category.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-anthracite-700 px-3 py-2 text-sm text-anthracite-200">
          <input type="checkbox" className="h-5 w-5 shrink-0 accent-gold-400" checked={value.serviceCategories.includes(category.id)} onChange={e => onChange({ ...value, serviceCategories: e.target.checked ? [...value.serviceCategories, category.id] : value.serviceCategories.filter(id => id !== category.id) })} />
          {en ? category.en : category.ro}
        </label>)}
      </fieldset>
      <label className="block text-sm font-medium text-anthracite-200">{en ? 'Coverage area *' : 'Zona de acoperire *'}
        <textarea className="input-field mt-2 min-h-24 resize-y" required minLength={2} maxLength={500} value={value.serviceAreas} onChange={e => onChange({ ...value, serviceAreas: e.target.value })} placeholder={en ? 'Countries, counties and cities where you work' : 'Țările, județele și orașele în care intervii'} />
      </label>
      <label className="block text-sm font-medium text-anthracite-200">{en ? 'Brands you work with (optional)' : 'Mărci cu care lucrezi (opțional)'}
        <input className="input-field mt-2 min-h-12" maxLength={500} value={value.serviceBrands} onChange={e => onChange({ ...value, serviceBrands: e.target.value })} />
      </label>
    </>}
  </fieldset>;
}
