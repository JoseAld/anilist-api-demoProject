import { Image, View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons'; // Certifique-se de ter instalado @expo/vector-icons

export default function AnimeScreen() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('pokemon');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnimeData = async (currentPage: number, query: string) => {
    try {
      setLoading(true);
      const graphqlQuery = `
        query ($page: Int, $perPage: Int, $search: String) {
          Page(page: $page, perPage: $perPage) {
            pageInfo {
              hasNextPage
            }
            media(search: $search, type: ANIME) {
              id
              title {
                romaji
                english
                native
              }
              coverImage {
                large
              }
              averageScore
            }
          }
        }
      `;

      const variables = {
        search: query,
        page: currentPage,
        perPage: 10
      };

      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables
        })
      });

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      return {
        media: data.data.Page.media,
        hasMore: data.data.Page.pageInfo.hasNextPage
      };
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
      throw err;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMedia = async (newSearch = false) => {
    try {
      setError(null);
      const currentPage = newSearch ? 1 : page;
      const result = await fetchAnimeData(currentPage, searchQuery);
      
      if (newSearch) {
        setMedia(result.media);
        setPage(1);
      } else {
        setMedia(prev => [...prev, ...result.media]);
      }
      
      setHasMore(result.hasMore);
    } catch (err) {
      // Error já é tratado no fetchAnimeData
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim().length > 0) {
      loadMedia(true);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadMedia();
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMedia(true);
  };

  useEffect(() => {
    loadMedia(true);
  }, []);

  return (
    <View style={styles.container}>
      {/* Barra de pesquisa */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar animes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Lista de resultados */}
      {error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      ) : media.length === 0 && !loading ? (
        <View style={styles.centerContainer}>
          <Text>Nenhum resultado encontrado</Text>
        </View>
      ) : (
        <FlatList
          data={media}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              {item.coverImage?.large && (
                <Image
                  source={{ uri: item.coverImage.large }}
                  style={styles.image}
                />
              )}
              <Text style={styles.title}>{item.title.romaji || item.title.english || item.title.native}</Text>
              {item.averageScore && (
                <Text style={styles.score}>⭐ {item.averageScore}%</Text>
              )}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && !refreshing && media.length > 0 ? (
              <ActivityIndicator size="small" />
            ) : null
          }
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      {loading && media.length === 0 && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1C',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#7B68EE',
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  searchButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  listContent: {
    padding: 10,
  },
  item: {
    marginBottom: 20,
    backgroundColor: '#363636',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: 'white'
  },
  score: {
    textAlign: 'center',
    color: '#666',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
  },
});