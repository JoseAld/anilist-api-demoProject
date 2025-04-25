import { Image, View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';

export default function AnimeScreen() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnimeData = async () => {
      try {
        const query = `
          query ($page: Int, $perPage: Int, $search: String) {
            Page(page: $page, perPage: $perPage) {
              media(search: $search, type: ANIME) {
                id
                title {
                  romaji
                }
                coverImage {
                  large
                }
              }
            }
          }
        `;

        const variables = {
          search: "pokemo",
          page: 1,
          perPage: 10
        };

        const response = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables
          })
        });

        const data = await response.json();
        
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }

        setMedia(data.data.Page.media);
        console.log(data)
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimeData();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {media.map(item => (
        <View key={item.id} style={styles.item}>
          {item.coverImage?.large && (
            <Image
              source={{ uri: item.coverImage.large }}
              style={styles.image}
            />
          )}
          <Text style={styles.title}>{item.title.romaji}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  item: {
    marginBottom: 20,
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 300,
    borderRadius: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});