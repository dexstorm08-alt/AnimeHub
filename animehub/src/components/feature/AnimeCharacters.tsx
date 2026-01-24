import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'

interface Character {
  id: string
  name: string
  name_japanese?: string
  name_romaji?: string
  role: string
  image_url?: string
  description?: string
  voice_actor?: string
  voice_actor_japanese?: string
}

type ParsedCharacterDetails = {
  height?: string
  weight?: string
  age?: string
  birthday?: string
  gender?: string
  bloodType?: string
  affiliation?: string
  occupation?: string
  father?: string
  mother?: string
  siblings?: string
  spouse?: string
  partner?: string
  alias?: string
  species?: string
  origin?: string
}

const detailLabels: Record<keyof ParsedCharacterDetails, string> = {
  height: 'Height',
  weight: 'Weight',
  age: 'Age',
  birthday: 'Birthday',
  gender: 'Gender',
  bloodType: 'Blood type',
  affiliation: 'Affiliation',
  occupation: 'Occupation',
  father: 'Father',
  mother: 'Mother',
  siblings: 'Siblings',
  spouse: 'Spouse',
  partner: 'Partner',
  alias: 'Alias',
  species: 'Species',
  origin: 'Origin'
}

function extractCharacterDetails(rawText?: string): ParsedCharacterDetails {
  if (!rawText) return {}

  const text = rawText
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const out: ParsedCharacterDetails = {}

  type Pattern = { keys: string[]; assign: (val: string) => void }
  const patterns: Pattern[] = [
    { keys: ['height'], assign: (v) => (out.height = v) },
    { keys: ['weight'], assign: (v) => (out.weight = v) },
    { keys: ['age'], assign: (v) => (out.age = v) },
    { keys: ['birthday', 'birth date', 'born'], assign: (v) => (out.birthday = v) },
    { keys: ['gender', 'sex'], assign: (v) => (out.gender = v) },
    { keys: ['blood type', 'blood'], assign: (v) => (out.bloodType = v) },
    { keys: ['affiliation', 'organization', 'team'], assign: (v) => (out.affiliation = v) },
    { keys: ['occupation', 'job', 'role'], assign: (v) => (out.occupation = v) },
    { keys: ['father', 'dad'], assign: (v) => (out.father = v) },
    { keys: ['mother', 'mom'], assign: (v) => (out.mother = v) },
    { keys: ['sibling', 'brother', 'sister', 'siblings'], assign: (v) => (out.siblings = v) },
    { keys: ['spouse', 'wife', 'husband'], assign: (v) => (out.spouse = v) },
    { keys: ['partner'], assign: (v) => (out.partner = v) },
    { keys: ['alias', 'aka', 'also known as', 'nicknames', 'nickname'], assign: (v) => (out.alias = v) },
    { keys: ['species', 'race'], assign: (v) => (out.species = v) },
    { keys: ['origin', 'hometown', 'home town', 'from'], assign: (v) => (out.origin = v) }
  ]

  for (const { keys, assign } of patterns) {
    const keyGroup = keys
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')
    const re = new RegExp(
      `(?:^|[.;\n\r\t\s])(?:${keyGroup})\s*[:\-—]\\s*([^.;\n\r]+)`,
      'i'
    )
    const m = text.match(re)
    if (m && m[1]) {
      const value = m[1].trim()
      if (value) assign(value)
    }
  }

  const parentsMatch = text.match(/parents\s*[:\-—]\s*([^.;\n\r]+)/i)
  if (parentsMatch?.[1]) {
    const parents = parentsMatch[1].trim()
    if (!out.father && /father|dad/i.test(parents)) {
      const fm = parents.match(/(?:father|dad)\s*[:\-—]?\s*([^,;]+)/i)
      if (fm?.[1]) out.father = fm[1].trim()
    }
    if (!out.mother && /mother|mom/i.test(parents)) {
      const mm = parents.match(/(?:mother|mom)\s*[:\-—]?\s*([^,;]+)/i)
      if (mm?.[1]) out.mother = mm[1].trim()
    }
  }

  return out
}

interface AnimeCharactersProps {
  animeId: string
}

export default function AnimeCharacters({ animeId }: AnimeCharactersProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({})
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)

  const toggleExpanded = (id: string) => {
    setExpandedById(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const openDetails = (character: Character) => {
    setSelectedCharacter(character)
  }

  const closeDetails = () => {
    setSelectedCharacter(null)
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDetails()
      }
    }
    if (selectedCharacter) {
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    }
  }, [selectedCharacter])

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('anime_characters')
          .select('*')
          .eq('anime_id', animeId)
          .order('role', { ascending: true })

        if (fetchError) {
          console.error('Error fetching characters:', fetchError)
          setError('Failed to load characters')
          return
        }

        setCharacters(data || [])
      } catch (err) {
        console.error('Error fetching characters:', err)
        setError('Failed to load characters')
      } finally {
        setLoading(false)
      }
    }

    if (animeId) {
      fetchCharacters()
    }
  }, [animeId])

  const getFilteredCharacters = () => {
    return characters.filter(char => char.role === 'main')
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'main':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
      case 'supporting':
        return 'bg-gradient-to-r from-blue-400 to-purple-500 text-white'
      case 'antagonist':
        return 'bg-gradient-to-r from-red-400 to-pink-500 text-white'
      case 'background':
        return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white'
      default:
        return 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'main':
        return '⭐'
      case 'supporting':
        return '👥'
      case 'antagonist':
        return '😈'
      case 'background':
        return '👤'
      default:
        return '🎭'
    }
  }

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
        <div className="text-center py-12">
          <div className="text-red-500 text-xl mb-2">❌</div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (characters.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">🎭</div>
          <h3 className="text-xl font-bold text-gray-600 mb-2">No Characters Available</h3>
          <p className="text-gray-500">Character information will appear here once imported.</p>
        </div>
      </div>
    )
  }

  const filteredCharacters = getFilteredCharacters()

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-teal-800 flex items-center">
          <i className="ri-group-line mr-3 text-pink-500"></i>
          Characters
        </h2>
        <div className="text-sm text-gray-600">
          {characters.length} characters
        </div>
      </div>

      {/* Main Characters Only */}
      <div className="flex items-center gap-2 mb-8">
        <div className="px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg flex items-center">
          <span className="mr-2">⭐</span>
          Main Characters
        </div>
        <div className="text-sm text-gray-600">
          ({getFilteredCharacters().length} main characters)
        </div>
      </div>

      {/* Characters Grid */}
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredCharacters.map((character, index) => (
            <motion.div
              key={character.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openDetails(character)
                }
              }}
              onClick={() => openDetails(character)}
              className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300 group cursor-pointer"
            >
              {/* Character Image */}
              <div className="relative mb-4">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-teal-200 to-cyan-300">
                  {character.image_url ? (
                    <img
                      src={character.image_url}
                      alt={character.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center text-3xl ${character.image_url ? 'hidden' : ''}`}>
                    🎭
                  </div>
                </div>
                
                {/* Role Badge */}
                <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold ${getRoleColor(character.role)}`}>
                  {getRoleIcon(character.role)} {character.role}
                </div>
              </div>

              {/* Character Info */}
              <div className="text-center">
                <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-teal-600 transition-colors">
                  {character.name}
                </h3>
                
                {character.name_japanese && character.name_japanese !== character.name && (
                  <p className="text-gray-600 text-sm mb-2">{character.name_japanese}</p>
                )}
                
                {character.name_romaji && (
                  <p className="text-gray-500 text-xs mb-3 italic">
                    Also known as: {character.name_romaji}
                  </p>
                )}

                {/* Parsed Details */}
                {character.description && (() => {
                  const details = extractCharacterDetails(character.description)
                  const entries = (Object.entries(details) as Array<[keyof ParsedCharacterDetails, string]>).filter(([, v]) => Boolean(v && v.trim()))
                  const isExpanded = Boolean(expandedById[character.id])
                  const visible = isExpanded ? entries : entries.slice(0, 6)

                  return entries.length > 0 ? (
                    <div className="mt-3 text-left relative z-10">
                      <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Details</div>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {visible.map(([k, v]) => (
                          <li key={k as string} className="flex items-start gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-100 whitespace-nowrap">
                              {detailLabels[k]}
                            </span>
                            <span className="text-xs text-gray-700 break-words">{v}</span>
                          </li>
                        ))}
                      </ul>
                      {entries.length > 6 && (
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpanded(character.id)
                          }}
                          className="mt-2 text-[11px] text-teal-700 hover:text-teal-800 font-medium underline"
                        >
                          {isExpanded ? 'Show less' : `Show ${entries.length - 6} more`}
                        </button>
                      )}
                    </div>
                  ) : null
                })()}

                {/* Description */}
                {character.description && (
                  <div
                    id={`desc-${character.id}`}
                    className={`mt-3 text-xs text-gray-600 transition-[max-height] duration-300 ease-in-out ${
                      expandedById[character.id]
                        ? 'max-h-[1000px]'
                        : 'max-h-16 overflow-hidden'
                    }`}
                  >
                    {character.description}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
      </motion.div>

      {filteredCharacters.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">⭐</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No main characters found</h3>
          <p className="text-gray-500">
            No main characters found for this anime.
          </p>
        </div>
      )}

      {/* Character Details Modal */}
      {selectedCharacter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="character-title"
          onClick={closeDetails}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-3xl mx-4 bg-white rounded-2xl shadow-2xl border border-white/60 overflow-hidden"
          >
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-6">
                <div className="w-28 h-28 rounded-xl overflow-hidden bg-gradient-to-br from-teal-200 to-cyan-300 flex-shrink-0">
                  {selectedCharacter.image_url ? (
                    <img
                      src={selectedCharacter.image_url}
                      alt={selectedCharacter.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🎭</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 id="character-title" className="text-2xl font-bold text-gray-900">
                        {selectedCharacter.name}
                      </h3>
                      {selectedCharacter.name_japanese && selectedCharacter.name_japanese !== selectedCharacter.name && (
                        <div className="text-gray-600 text-sm mt-1">{selectedCharacter.name_japanese}</div>
                      )}
                      {selectedCharacter.name_romaji && (
                        <div className="text-gray-500 text-xs italic mt-1">Also known as: {selectedCharacter.name_romaji}</div>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold self-start ${getRoleColor(selectedCharacter.role)}`}>
                      {getRoleIcon(selectedCharacter.role)} {selectedCharacter.role}
                    </div>
                  </div>

                  {(selectedCharacter.voice_actor || selectedCharacter.voice_actor_japanese) && (
                    <div className="mt-3 text-sm text-gray-700">
                      {selectedCharacter.voice_actor && (
                        <div><span className="font-semibold">Voice actor:</span> {selectedCharacter.voice_actor}</div>
                      )}
                      {selectedCharacter.voice_actor_japanese && (
                        <div><span className="font-semibold">Voice actor (JP):</span> {selectedCharacter.voice_actor_japanese}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Details grid */}
              {(() => {
                const details = extractCharacterDetails(selectedCharacter.description)
                const entries = (Object.entries(details) as Array<[keyof ParsedCharacterDetails, string]>).filter(([, v]) => Boolean(v && v.trim()))
                if (entries.length === 0) return null
                return (
                  <div className="mt-6">
                    <div className="text-[12px] uppercase tracking-wide text-gray-500 mb-2">Details</div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {entries.map(([k, v]) => (
                        <li key={k as string} className="flex items-start gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-100 whitespace-nowrap">
                            {detailLabels[k]}
                          </span>
                          <span className="text-sm text-gray-800 break-words">{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })()}

              {/* Description */}
              {selectedCharacter.description && (
                <div className="mt-6">
                  <div className="text-[12px] uppercase tracking-wide text-gray-500 mb-2">Description</div>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedCharacter.description}</p>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={closeDetails}
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
