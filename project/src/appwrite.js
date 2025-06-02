import { Client, Databases, ID, Query } from 'appwrite';

const PROJECT_ID=import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID=import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID=import.meta.env.VITE_APPWRITE_COLLECTION_ID;

const client= new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID);

const database= new Databases(client);
    
export { database, DATABASE_ID, COLLECTION_ID };

export const updateSearchCount = async (searchTerm, movie) => {
  try {
    // 1. Attempt to find document by movie_id first (more reliable identifier)
    const movieResult = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.equal('movie_id', parseInt(movie.id)), // Use the movie object's ID
    ]);

    if (movieResult.documents.length > 0) {
        // Document found by movie_id - update count and trendingScore
        const doc = movieResult.documents[0];
        const newSearchCount = (doc.count || 0) + 1; // Use existing count or 0
        const currentOpenCount = doc.openCount || 0; // Use existing openCount or 0
        const newTrendingScore = (newSearchCount * 2) + currentOpenCount;

        await database.updateDocument(
            DATABASE_ID,
            COLLECTION_ID,
            doc.$id,
            {
                count: newSearchCount,
                trendingScore: newTrendingScore,
            }
        );
        console.log(`Updated search count for existing document with movie_id ${movie.id}`);

    } else {
        // 2. Document not found by movie_id, fall back to searching by searchTerm (existing logic)
        const termResult = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.equal('searchTerm', searchTerm),
        ]);

        if (termResult.documents.length > 0) {
            // Document found by searchTerm - update count and trendingScore
            const doc = termResult.documents[0];
             const newSearchCount = (doc.count || 0) + 1;
             const currentOpenCount = doc.openCount || 0;
             const newTrendingScore = (newSearchCount * 2) + currentOpenCount;

            await database.updateDocument(
                DATABASE_ID,
                COLLECTION_ID,
                doc.$id,
                {
                    count: newSearchCount,
                    trendingScore: newTrendingScore,
                }
            );
             console.log(`Updated search count for existing document with searchTerm "${searchTerm}"`);

        } else {
            // 3. Document not found by either - create a new document
            await database.createDocument(
                DATABASE_ID,
                COLLECTION_ID,
                ID.unique(),
                {
                    searchTerm,
                    count: 1,
                    openCount: 0, // Initialize openCount to 0 for new search entries
                    movie_id: parseInt(movie.id), // Ensure movie_id is stored as integer
                    poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                    trendingScore: 2, // (1 * 2) + 0 = 2
                }
            );
            console.log(`Created new document for movie_id ${movie.id} from search term "${searchTerm}"`);
        }
    }

  } catch (error) {
    console.error("Error updating search count:", error);
  }
};

export const getTrendingMovies=async()=>{
    try{
        const result=await database.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.limit(5), Query.orderDesc('trendingScore')]);
        return result.documents;
            
    }catch(error){
        console.error(error);
    }
}