import { register, login, createProject, createApiKey, getProjects } from "../lib/satellite";

export default {
	namespaced: true,

	state: () => ({
		email: null,
		token: null,
		apiKey: null,
		projectId: null
	}),
	mutations: {
		setSession(state, { email, token, apiKey, projectId }) {
			console.log("setSession", { email, token, apiKey, projectId });

			state.email = email;
			state.token = token;
			state.apiKey = apiKey;
			state.projectId = projectId;
		}
	},
	actions: {
		async signUp({ commit, dispatch }, { email, password }) {
			await register({
				fullName: "Iris User",
				shortName: "Iris User",
				email,
				password
			});

			return dispatch("login", {
				email,
				password
			})
		},

		async login({ commit }, { email, password }) {
			const { token } = await login({
				email,
				password
			});

			// project name to find and create Iris project
			const projectName = "Iris";

			const { myProjects } = await getProjects({ token });
			let projectId = myProjects.find(project => project.name === projectName).id;

			// create new project if it doesn't exist
			if(typeof projectId !== "string") {
				console.log("couldn't find Iris project, creating new one");

				const { id } = await createProject({
					token,
					name: projectName,
					description: "Your buckets created and managed by Iris."
				});

				projectId = id;
			}

			// create new api key
			const { key } = await createApiKey({
				token,
				projectId,
				name: `${projectName} Key ${Date.now()}`
			});

			commit("setSession", {
				email,
				token,
				projectId,
				apiKey: key
			});
		}
	},
	getters: {
		isLoggedIn: (state) => typeof state.token === "string"
	}
};
