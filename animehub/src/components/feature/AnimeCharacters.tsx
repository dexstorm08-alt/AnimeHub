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
}

interface AnimeCharactersProps {
  animeId: string
}

export default function AnimeCharacters({ animeId }: AnimeCharactersProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
              className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300 group"
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
  )
}
