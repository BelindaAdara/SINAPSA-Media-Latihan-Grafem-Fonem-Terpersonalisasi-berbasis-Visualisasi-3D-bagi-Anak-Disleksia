function unwrap(result) {
  if (result.error) throw result.error;
  return result.data;
}

function createSupabaseRepository(client) {
  return {
    async getLetters(filters = {}) {
      let query = client.from('letters').select('*').order('sort_order');
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.lookalike !== undefined && filters.lookalike !== null) query = query.eq('is_lookalike', filters.lookalike);
      const letters = unwrap(await query);
      if (!filters.q) return letters;
      const needle = filters.q.toLocaleLowerCase();
      return letters.filter((letter) =>
        [letter.symbol, letter.phoneme_ipa, letter.phoneme_hint, letter.tts_syllable]
          .some((value) => value.toLocaleLowerCase().includes(needle)));
    },
    async getLetter(symbol) {
      return unwrap(await client.from('letters').select('*').eq('symbol', symbol).maybeSingle());
    },
    async getLettersBySymbols(symbols) {
      if (!symbols.length) return [];
      return unwrap(await client.from('letters').select('symbol').in('symbol', symbols));
    },
    async getExercises() {
      return unwrap(await client.from('exercise_types').select('*').order('sort_order'));
    },
    async getExerciseType(id) {
      return unwrap(await client.from('exercise_types').select('*').eq('id', id).maybeSingle());
    },
    async getWords(limit) {
      return unwrap(await client.from('words').select('*').order('sort_order').limit(limit));
    },
    async createChild(input) {
      const child = unwrap(await client.from('children').insert(input).select('*').single());
      const settings = unwrap(await client.from('child_settings').insert({ child_id: child.id }).select('*').single());
      return { ...child, settings };
    },
    async getChild(id) {
      const child = unwrap(await client.from('children').select('*').eq('id', id).maybeSingle());
      if (!child) return null;
      const settings = unwrap(await client.from('child_settings').select('*').eq('child_id', id).maybeSingle());
      return { ...child, settings };
    },
    async updateChild(id, changes) {
      const result = unwrap(await client.from('children').update({ ...changes, updated_at: new Date().toISOString() }).eq('id', id).select('*').maybeSingle());
      return result;
    },
    async updateChildSettings(id, changes) {
      return unwrap(await client.from('child_settings').update({ ...changes, updated_at: new Date().toISOString() }).eq('child_id', id).select('*').maybeSingle());
    },
    async getMastery(childId, letter) {
      return unwrap(await client.from('letter_mastery').select('*').eq('child_id', childId).eq('letter', letter).maybeSingle());
    },
    async getMasteryForChild(childId) {
      return unwrap(await client.from('letter_mastery').select('*').eq('child_id', childId));
    },
    async upsertMastery(childId, letter, values) {
      return unwrap(await client.from('letter_mastery').upsert({ child_id: childId, letter, ...values }).select('*').single());
    },
    async deleteMastery(childId, letter) {
      unwrap(await client.from('letter_mastery').delete().eq('child_id', childId).eq('letter', letter));
    },
    async createSessionAtomic(session, items, masteryUpdates) {
      const id = unwrap(await client.rpc('create_session_atomic', {
        p_session: session,
        p_items: items,
        p_mastery_updates: masteryUpdates,
      }));
      return { id };
    },
    async listSessions({ child_id: childId, limit, offset, from, to }) {
      let query = client.from('sessions').select('*', { count: 'exact' }).eq('child_id', childId).order('started_at', { ascending: false });
      if (from) query = query.gte('started_at', from);
      if (to) query = query.lte('started_at', to);
      const result = await query.range(offset, offset + limit - 1);
      return { data: unwrap(result), count: result.count };
    },
    async getAllSessions(childId) {
      return unwrap(await client.from('sessions').select('*').eq('child_id', childId).order('started_at', { ascending: true }).limit(10000));
    },
    async getSession(id) {
      return unwrap(await client.from('sessions').select('*').eq('id', id).maybeSingle());
    },
    async getItemsForSession(id) {
      return unwrap(await client.from('session_items').select('*').eq('session_id', id).order('item_index'));
    },
    async getItemsForChild(childId) {
      return unwrap(await client.from('session_items').select('*').eq('child_id', childId).order('item_index').limit(10000));
    },
    async getItemsForLetter(childId, letter) {
      const rows = unwrap(await client.from('session_items')
        .select('*, sessions!inner(started_at, ended_at)')
        .eq('child_id', childId).eq('letter', letter));
      return rows.map((row) => ({
        ...row,
        started_at: row.sessions.started_at,
        ended_at: row.sessions.ended_at,
      }));
    },
    async updateSession(id, changes) {
      return unwrap(await client.from('sessions').update({ ...changes, updated_at: new Date().toISOString() }).eq('id', id).select('*').maybeSingle());
    },
    async deleteSession(id) {
      unwrap(await client.from('sessions').delete().eq('id', id));
    },
    async getConfusions(childId) {
      const items = await this.getItemsForChild(childId);
      const counts = new Map();
      for (const item of items) {
        if (item.chosen_value && item.chosen_value !== item.letter) {
          const key = `${item.letter}:${item.chosen_value}`;
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      }
      return [...counts.entries()].map(([key, count]) => {
        const [target, chosen] = key.split(':');
        return { target, chosen, count };
      });
    },
  };
}

module.exports = { createSupabaseRepository };
