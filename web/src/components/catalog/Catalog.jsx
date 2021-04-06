import React, { useEffect, useState, memo } from "react";
import styled from "styled-components";
import InfiniteScroll from "react-infinite-scroller";
import { stringify } from "query-string";
import { parse, formatISO, startOfYear, endOfYear } from "date-fns";

import useDebounce from "../../utils/hooks/useDebounce";
import List from "./List";
import Loader from "../common/Loader";
import Filters from "./Filters";
import Sorts from "./Sorts";
import useUser from "../../hooks/useUser";
import useFavorites from "../../hooks/useFavorites";

const SORTS = [
  {
    name: "Date",
    code: "first_release_date",
  },
  {
    name: "Rating",
    code: "rating",
  },
];

function Catalog({ query, modifier = "games" }) {
  const [dateGte, setDateGte] = useState("");
  const [dateLte, setDateLte] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const { token } = useUser();
  const { favoritesHashmap, addFavorite, removeFavorite } = useFavorites();

  const [sort, setSort] = useState("-" + SORTS[0].code);

  const [next, setNext] = useState(1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 250);

  function fetchGames(page, clear, token) {
    if (modifier === "saved" && !token) {
      setLoading(false);
      setData([]);
      return;
    }

    setLoading(true);

    const query = {
      limit: 20,
      offset: 20 * page,
      ordering: sort,
    };

    if (debouncedQuery) {
      query.search = debouncedQuery;
    }

    if (dateGte.length === 4) {
      query.first_release_date__gte = formatISO(
        startOfYear(parse(dateGte, "yyyy", new Date()))
      );
    }

    if (dateLte.length === 4) {
      query.first_release_date__lte = formatISO(
        endOfYear(parse(dateLte, "yyyy", new Date()))
      );
    }

    if (selectedGenres && selectedGenres.length) {
      query.genres = selectedGenres.map(({ value }) => value);
    }

    if (selectedThemes && selectedThemes.length) {
      query.themes = selectedThemes.map(({ value }) => value);
    }

    if (selectedPlatforms && selectedPlatforms.length) {
      query.platforms = selectedPlatforms.map(({ value }) => value);
    }

    const headers = {};

    if (token) {
      headers.Authorization = `Token ${token}`;
    }

    return fetch(
      `${process.env.REACT_APP_API_ENDPOINT}/gig/${modifier}/?${stringify(
        query
      )}`,
      {
        headers,
      }
    )
      .then((res) => res.json())
      .then(({ next, results }) => {
        setNext(next);
        setData(clear ? results : [...data, ...results]);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        console.error(error);
      });
  }

  useEffect(() => {
    fetchGames(0, true, token);
  }, [
    debouncedQuery,
    dateGte,
    dateLte,
    selectedGenres,
    selectedThemes,
    selectedPlatforms,
    sort,
    token,
    modifier,
  ]);

  if (modifier === "saved" && !token) {
    return null;
  }

  return (
    <Wrapper>
      <Top>
        <Filters
          // Dates
          dateGte={dateGte}
          setDateGte={setDateGte}
          dateLte={dateLte}
          setDateLte={setDateLte}
          // Filters
          selectedGenres={selectedGenres}
          setSelectedGenres={setSelectedGenres}
          selectedThemes={selectedThemes}
          setSelectedThemes={setSelectedThemes}
          selectedPlatforms={selectedPlatforms}
          setSelectedPlatforms={setSelectedPlatforms}
        />
        <Sorts sorts={SORTS} sort={sort} setSort={setSort} />
      </Top>
      <InfiniteScroll
        pageStart={-1}
        loadMore={(page) => fetchGames(page, false, token)}
        hasMore={!loading && !!next}
        loader={<CustomLoader key={0} />}
      >
        <List
          games={data}
          loading={loading}
          addFavorite={async (id) => {
            await addFavorite(id);
            if (modifier === "saved") {
              await fetchGames(0, true, token);
            }
          }}
          removeFavorite={async (id) => {
            await removeFavorite(id);
            if (modifier === "saved") {
              await fetchGames(0, true, token);
            }
          }}
          favoritesHashmap={favoritesHashmap}
        />
      </InfiniteScroll>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  padding-bottom: 30px;
`;

const Top = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
`;

const CustomLoader = styled(Loader)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30px;
`;

export default memo(Catalog);
