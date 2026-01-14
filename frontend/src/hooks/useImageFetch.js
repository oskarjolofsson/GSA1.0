import useFetchAuthenticated from "./useFetch";

export default async function useDrillImageURLFetch(drill_id) {
    const response = await useFetchAuthenticated(`/api/v1/analysis/image/${drill_id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();
    return data.image_url;
}