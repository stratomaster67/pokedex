import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

// Serviço da API
const getPokemons = async (offset = 0, limit = 20) => {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/?offset=${offset}&limit=${limit}`);
    return await response.json();
  } catch (error) {
    throw error;
  }
};

const getPokemonDetails = async (urlOrId) => {
  try {
    const url = typeof urlOrId === 'number' ? `https://pokeapi.co/api/v2/pokemon/${urlOrId}/` : urlOrId;
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Componente Card do Pokémon no estilo Pokémon GO
const PokemonCard = ({ pokemon, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardId}>#{pokemon.id.toString().padStart(3, '0')}</Text>
    </View>
    <Image
      source={{ uri: pokemon.image }}
      style={styles.image}
    />
    <View style={styles.cardFooter}>
      <Text style={styles.cardName}>
        {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
      </Text>
    </View>
  </TouchableOpacity>
);

// Modal de Detalhes no estilo Pokémon GO
const PokemonDetailsModal = ({ visible, pokemon, onClose }) => {
  if (!pokemon) return null;

  const getTypeColor = (type) => {
    const typeColors = {
      normal: '#A8A878',
      fire: '#F08030',
      water: '#6890F0',
      electric: '#F8D030',
      grass: '#78C850',
      ice: '#98D8D8',
      fighting: '#C03028',
      poison: '#A040A0',
      ground: '#E0C068',
      flying: '#A890F0',
      psychic: '#F85888',
      bug: '#A8B820',
      rock: '#B8A038',
      ghost: '#705898',
      dragon: '#7038F8',
      dark: '#705848',
      steel: '#B8B8D0',
      fairy: '#EE99AC',
    };
    return typeColors[type] || '#68A090';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>POKÉDEX</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                <View style={styles.pokemonDisplay}>
                  <Image
                    source={{ uri: pokemon.sprites.front_default }}
                    style={styles.detailImage}
                  />
                  <View style={styles.pokemonInfo}>
                    <Text style={styles.detailName}>
                      {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
                    </Text>
                    <Text style={styles.detailId}>Nº {pokemon.id.toString().padStart(3, '0')}</Text>
                  </View>
                </View>

                <View style={styles.detailsPanel}>
                  <View style={styles.panelSection}>
                    <Text style={styles.panelTitle}>INFO</Text>
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>ALTURA</Text>
                        <Text style={styles.statValue}>{(pokemon.height / 10).toFixed(1)}m</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>PESO</Text>
                        <Text style={styles.statValue}>{(pokemon.weight / 10).toFixed(1)}kg</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.panelSection}>
                    <Text style={styles.panelTitle}>TIPOS</Text>
                    <View style={styles.typesContainer}>
                      {pokemon.types.map((typeInfo, index) => (
                        <View 
                          key={index} 
                          style={[
                            styles.typeBadge,
                            { backgroundColor: getTypeColor(typeInfo.type.name) }
                          ]}
                        >
                          <Text style={styles.typeText}>
                            {typeInfo.type.name.toUpperCase()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.panelSection}>
                    <Text style={styles.panelTitle}>HABILIDADES</Text>
                    <View style={styles.abilitiesContainer}>
                      {pokemon.abilities.map((abilityInfo, index) => (
                        <View key={index} style={styles.abilityItem}>
                          <Text style={styles.abilityText}>
                            {abilityInfo.ability.name.replace('-', ' ').toUpperCase()}
                            {abilityInfo.is_hidden && ' (OCULTA)'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.panelSection}>
                    <Text style={styles.panelTitle}>ESTATÍSTICAS</Text>
                    {pokemon.stats.map((statInfo, index) => (
                      <View key={index} style={styles.statRow}>
                        <Text style={styles.statName}>
                          {statInfo.stat.name.replace('-', ' ').toUpperCase()}
                        </Text>
                        <View style={styles.statBarContainer}>
                          <View 
                            style={[
                              styles.statBar,
                              { width: `${Math.min(100, (statInfo.base_stat / 255) * 100)}%` }
                            ]} 
                          />
                        </View>
                        <Text style={styles.statNumber}>{statInfo.base_stat}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Componente Principal
export default function App() {
  const [pokemons, setPokemons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextUrl, setNextUrl] = useState(null);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadPokemons = async (url = null) => {
    try {
      if (!url) setLoading(true);
      else setLoadingMore(true);

      const data = url ? await fetch(url).then(res => res.json()) : await getPokemons();
      
      const pokemonsWithDetails = await Promise.all(
        data.results.map(async (pokemon) => {
          const details = await getPokemonDetails(pokemon.url);
          return {
            id: details.id,
            name: details.name,
            image: details.sprites.front_default,
            url: pokemon.url,
          };
        })
      );
      
      if (url) {
        setPokemons(prev => [...prev, ...pokemonsWithDetails]);
      } else {
        setPokemons(pokemonsWithDetails);
      }
      
      setNextUrl(data.next);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os pokémons');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPokemons();
  }, []);

  const handleLoadMore = () => {
    if (nextUrl && !loadingMore) {
      loadPokemons(nextUrl);
    }
  };

  const handlePokemonPress = async (pokemonId) => {
    try {
      setDetailLoading(true);
      const details = await getPokemonDetails(pokemonId);
      setSelectedPokemon(details);
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do Pokémon');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPokemon(null);
  };

  const renderPokemonCard = ({ item }) => (
    <PokemonCard 
      pokemon={item} 
      onPress={() => handlePokemonPress(item.id)}
    />
  );

  if (loading && pokemons.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingPokedex}>
          <Text style={styles.loadingTitle}>POKÉDEX</Text>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Carregando Pokémons...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header no estilo Pokémon GO */}
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.title}>POKÉDEX</Text>
        </View>
        <View style={styles.screenBorder}>
          <View style={styles.screen}>
            <Text style={styles.screenText}>
              {pokemons.length} POKÉMONS ENCONTRADOS
            </Text>
          </View>
        </View>
      </View>

      {/* Lista de Pokémons */}
      <FlatList
        data={pokemons}
        renderItem={renderPokemonCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          nextUrl ? (
            <TouchableOpacity 
              style={styles.loadMoreButton}
              onPress={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loadMoreText}>CARREGAR MAIS POKÉMONS</Text>
              )}
            </TouchableOpacity>
          ) : (
            <Text style={styles.endText}>Isso é tudo por agora!</Text>
          )
        }
      />

      {/* Modal de Detalhes */}
      <PokemonDetailsModal
        visible={modalVisible}
        pokemon={selectedPokemon}
        onClose={closeModal}
      />

      {/* Loading Overlay */}
      {detailLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingDetailText}>Consultando Pokédex...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// Estilos no tema Pokémon GO
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2', // Cinza claro do Pokémon GO
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#4FC3F7', // Azul claro do Pokémon GO
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingPokedex: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#4FC3F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4FC3F7',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#4FC3F7', // Azul principal do Pokémon GO
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 4,
    borderBottomColor: '#29B6F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  headerMain: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  screenBorder: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#BDBDBD',
  },
  screen: {
    backgroundColor: '#E0E0E0',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  screenText: {
    fontSize: 14,
    color: '#424242',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  list: {
    padding: 10,
    backgroundColor: '#F2F2F2',
  },
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
    minHeight: 140,
  },
  cardHeader: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4FC3F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cardId: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  image: {
    width: 80,
    height: 80,
    marginTop: 15,
    marginBottom: 10,
  },
  cardFooter: {
    backgroundColor: '#4FC3F7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#4FC3F7',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#29B6F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  endText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#4FC3F7',
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4FC3F7',
    padding: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#29B6F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalScroll: {
    flex: 1,
  },
  pokemonDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
    margin: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  detailImage: {
    width: 120,
    height: 120,
  },
  pokemonInfo: {
    flex: 1,
    alignItems: 'center',
  },
  detailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 5,
  },
  detailId: {
    fontSize: 16,
    color: '#666666',
    fontWeight: 'bold',
  },
  detailsPanel: {
    padding: 15,
  },
  panelSection: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4FC3F7',
    marginBottom: 10,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  typeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  abilitiesContainer: {
    // Estilo para container de habilidades
  },
  abilityItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  abilityText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statName: {
    width: 100,
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  statBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginHorizontal: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statBar: {
    height: '100%',
    backgroundColor: '#4FC3F7',
    borderRadius: 6,
  },
  statNumber: {
    width: 30,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(79, 195, 247, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 15,
    borderWidth: 4,
    borderColor: '#4FC3F7',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  loadingDetailText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
    fontWeight: 'bold',
  },
});