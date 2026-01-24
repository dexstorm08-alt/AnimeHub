import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { extractCharacterInfo } from '../../utils/characterInfoExtractor'

interface Character {
  id: string
  name: string
  name_japanese?: string
  name_romaji?: string
  role: string
  image_url?: string
  description?: string
}

interface AnimeCharactersProps {
  animeId: string
}

export default function AnimeCharacters({ animeId }: AnimeCharactersProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'main'>('main')
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [isDescExpanded, setIsDescExpanded] = useState(false)

  useEffect(() => {
    setIsDescExpanded(false)
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
  const extracted = useMemo(() => extractCharacterInfo(selectedCharacter?.description), [selectedCharacter?.description])

  return (
    <>
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
              className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300 group cursor-pointer"
              onClick={() => setSelectedCharacter(character)}
              role="button"
              aria-label={`View details for ${character.name}`}
            >
              {/* Character Image */}
              <div className="relative mb-4">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-teal-200 to-cyan-300">
                  {character.image_url ? (
                    <img
                      src={character.image_url}
                      alt={character.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      width={96}
                      height={96}
                      loading="lazy"
                      decoding="async"
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

                {character.description && (
                  <div className="text-xs text-gray-600 line-clamp-3">
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
    </div>

    {/* Character Detail Modal */}
    <AnimatePresence>
      {selectedCharacter && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCharacter(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="character-detail-title"
          >
            <div className="relative bg-gradient-to-r from-teal-600 to-cyan-600 h-32">
              <button
                onClick={() => setSelectedCharacter(null)}
                className="absolute top-3 right-3 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
                aria-label="Close"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
              <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-full overflow-hidden ring-4 ring-white/80 bg-white shadow-lg">
                {selectedCharacter.image_url ? (
                  <img
                    src={selectedCharacter.image_url}
                    alt={selectedCharacter.name}
                    className="w-full h-full object-cover"
                    width={80}
                    height={80}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🎭</div>
                )}
              </div>
            </div>
            
            <div className="pt-12 p-6 overflow-y-auto max-h-[calc(85vh-8rem)]">
              <h3 id="character-detail-title" className="text-xl font-bold text-gray-900 mb-1">
                {selectedCharacter.name}
              </h3>
              {(selectedCharacter.name_romaji || selectedCharacter.name_japanese) && (
                <div className="text-sm text-gray-600 mb-3">
                  {selectedCharacter.name_romaji && (
                    <span className="mr-3 italic">{selectedCharacter.name_romaji}</span>
                  )}
                  {selectedCharacter.name_japanese && (
                    <span className="text-gray-500">{selectedCharacter.name_japanese}</span>
                  )}
                </div>
              )}
              
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                  {selectedCharacter.role}
                </span>
              </div>
              {/* Names (structured) */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Names</h4>
                <dl className="overflow-hidden rounded-xl border border-gray-200 divide-y divide-gray-100">
                  <div className="grid grid-cols-3 gap-2 px-4 py-3">
                    <dt className="text-xs text-gray-500 col-span-1">English</dt>
                    <dd className="text-sm text-gray-800 col-span-2">{selectedCharacter.name}</dd>
                  </div>
                  {selectedCharacter.name_romaji && (
                    <div className="grid grid-cols-3 gap-2 px-4 py-3">
                      <dt className="text-xs text-gray-500 col-span-1">Romaji</dt>
                      <dd className="text-sm text-gray-800 col-span-2">{selectedCharacter.name_romaji}</dd>
                    </div>
                  )}
                  {selectedCharacter.name_japanese && (
                    <div className="grid grid-cols-3 gap-2 px-4 py-3">
                      <dt className="text-xs text-gray-500 col-span-1">Japanese</dt>
                      <dd className="text-sm text-gray-800 col-span-2">{selectedCharacter.name_japanese}</dd>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 px-4 py-3">
                    <dt className="text-xs text-gray-500 col-span-1">Role</dt>
                    <dd className="text-sm text-gray-800 col-span-2 capitalize">{selectedCharacter.role}</dd>
                  </div>
                </dl>
              </div>

              {/* Quick Facts */}
              {(extracted.height || extracted.weight || extracted.age || extracted.birthday || extracted.father || extracted.mother || extracted.siblings || extracted.origin || extracted.abilities || extracted.affiliations) && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Quick Facts</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {extracted.height && (
                      <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100"><span className="text-xs text-gray-500 w-20">Height</span><span className="text-sm text-gray-800">{extracted.height}</span></div>
                    )}
                    {extracted.weight && (
                      <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100"><span className="text-xs text-gray-500 w-20">Weight</span><span className="text-sm text-gray-800">{extracted.weight}</span></div>
                    )}
                    {extracted.age && (
                      <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100"><span className="text-xs text-gray-500 w-20">Age</span><span className="text-sm text-gray-800">{extracted.age}</span></div>
                    )}
                    {extracted.birthday && (
                      <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100"><span className="text-xs text-gray-500 w-20">Birthday</span><span className="text-sm text-gray-800">{extracted.birthday}</span></div>
                    )}
                    {extracted.father && (
                      <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100"><span className="text-xs text-gray-500 w-20">Father</span><span className="text-sm text-gray-800">{extracted.father}</span></div>
                    )}
                    {extracted.mother && (
                      <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100"><span className="text-xs text-gray-500 w-20">Mother</span><span className="text-sm text-gray-800">{extracted.mother}</span></div>
                    )}
                    {extracted.siblings && (
                      <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100"><span className="text-xs text-gray-500 w-20">Siblings</span><span className="text-sm text-gray-800">{extracted.siblings}</span></div>
                    )}
                    {extracted.origin && (
                      <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100"><span className="text-xs text-gray-500 w-20">Origin</span><span className="text-sm text-gray-800">{extracted.origin}</span></div>
                    )}
                    {extracted.abilities && (
                      <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100"><span className="text-xs text-gray-500 w-20">Abilities</span><span className="text-sm text-gray-800">{extracted.abilities}</span></div>
                    )}
                    {extracted.affiliations && (
                      <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100"><span className="text-xs text-gray-500 w-20">Affiliations</span><span className="text-sm text-gray-800">{extracted.affiliations}</span></div>
                    )}
                  </div>
                </div>
              )}

              {/* Biography */}
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Biography</h4>
              <div className="prose prose-sm max-w-none text-gray-700">
                {selectedCharacter.description ? (
                  <>
                    <p className={`leading-relaxed ${isDescExpanded ? '' : 'line-clamp-5'}`}>
                      {selectedCharacter.description}
                    </p>
                    {selectedCharacter.description.length > 260 && (
                      <button
                        className="mt-2 text-teal-700 hover:text-teal-900 font-medium"
                        onClick={() => setIsDescExpanded(v => !v)}
                      >
                        {isDescExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500">No additional information available for this character.</p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}
